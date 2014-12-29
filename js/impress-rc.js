/**
 * impress-rc.js
 *
 * impress-rc.js is a remote control for impress.js which works over Web sockets.
 * It triggers if an impress presentation is called with 'key' in its query string
 * for example: http://example.com/impress.html?key=foo
 * or alternatively the key can be provided in a form obtained by pressing 'p'.
 * If also the 'pwd' parameter is there, it will instrument impress.js to
 * send events on step transitions; the password can also be input after pressing 'p'.
 *
 *
 * Copyright 2014- Jacek Kopecky
 *
 * Released under the MIT and GPL Licenses.
 *
 * ------------------------------------------------
 *  author:  Jacek Kopecky
 *  version: 0.0.1
 *  source:  http://github.com/jacekkopecky/impress.js/
 */
(function() {
    'use strict';

    var impressRCKey = null;
    var impressRCPassword = null;

    // requires parseQueryParams from queryparams.js
    var query = parseQueryParams();

    if (query.key) impressRCKey = query.key[0];
    if (query.pwd) impressRCPassword = query.pwd[0];


    // tool function from impress
    var triggerEvent = function (el, eventName, detail) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(eventName, true, true, detail);
        el.dispatchEvent(event);
    };

    // add a password form in the original document where it loaded this script
    addKeyPasswordForm();

    var impressapi = null;
    var docuri = null;

    document.addEventListener("impress:init", function (event) {
        impressapi = event.detail.api;
        docuri = location.origin+location.pathname;
        instrumentApi();
        startWSConnection();
    }, false);

    document.addEventListener("impressRCView:init", function (event) {
        // impress-rcview.html gives us an impress-like API and also the URI of the presentation
        impressapi = event.detail.api;
        docuri = event.detail.uri;
        instrumentApi();

        // the checkbox for sending the first message should be off here
        // because the RC can soon get from the server a message with the last position
        if (!impressRCKey || !impressRCPassword) inputRCPassword(false);
    }, false);

    var socket = null;
    var socketMsgOnOpen = null;

    // send the message or if socket not open, save it for when it is open
    function socketSend(msg) {
        if (impressRCPassword) {
            msg.password = impressRCPassword;
        }
        msg = JSON.stringify(msg);
        if (socket && socket.readyState === 1) {
            // socket open
            socket.send(msg);
        } else {
            // socket not open, save the message for when it is open
            socketMsgOnOpen = msg;
            console.log("rc: deferring the next message");

            // this happens in remote controller when invoked without a key:
            // the user puts in a key and a password and wants immediately to
            // send the first goto() message, so goto() is invoked right after
            // the impressRCKeySet event that starts opening the websocket
        }
    }

    // instruments api.goto to send message; also adds the sending function to the api
    function instrumentApi() {
        var oldgoto = impressapi.goto;
        impressapi.goto = function(el, duration, fromReceivedRCMessage) {
            var step = oldgoto(el, duration);
            if (!fromReceivedRCMessage && impressRCPassword && socket) {
                if (step) {
                    // sending password as plain text; best use WebSocket over TLS
                    socketSend({cmd: 'goto', goto: step.id, screenBundle: impressapi.currScreenBundle()});
                    console.log("rc: sent message");
                } else {
                    console.log("rc: goto failed for some reason");
                }
            } else {
                console.log("rc: no msg sent");
            }
            return step;
        };

        impressapi.rcSend = socketSend;
    }

    var oldkey = null;

    function startWSConnection() {
        // nothing to do if we still have the socket and the key hasn't changed
        if (socket && oldkey == impressRCKey) return;
        oldkey = impressRCKey;

        // first, destroy old connection (if any)
        if (socket) {
            socket.onclose = null;
            socket.onerror = null;
            socket.close();
            socket = null;
        }

        // when we don't have key or an API, that's it
        if (!impressRCKey || !impressapi) return;

        // we have everything, start a new connection
        var wsserverpath = "ws://" + location.host +
                           "/impress-rc/" +
                           encodeURIComponent(docuri) + "/" +
                           encodeURIComponent(impressRCKey)

        console.log("rc: connecting to " + wsserverpath);
        socket = new WebSocket(wsserverpath);

        socket.onerror = function(error) {
            console.log('rc: WebSocket Error: ' + error);
            socket.onclose = null;
            socket.onerror = null;
            socket.close();
            socket = null;
            window.confirm("Error connecting to remote control server, reconnect?") && startWSConnection();
        };

        socket.onclose = function(close) {
            console.log('rc: WebSocket closed: ' + JSON.stringify(close));
            socket = null;
            window.confirm("Lost connection to remote control server, reconnect?") && startWSConnection();
        };

        socket.onopen = function(open) {
            console.log('rc: WebSocket opened');
            if (socketMsgOnOpen) {
                socket.send(socketMsgOnOpen);
                socketMsgOnOpen = null;
                console.log("rc: sent deferred message");
            }
        };

        socket.onmessage = function(event) {
            try {
                var message = JSON.parse(event.data);

                if (!message.cmd) {
                    console.log("WARNING: received message without a command: " + JSON.stringify(message));
                    return;
                }

                switch (message.cmd) {
                    case 'goto':  handleGotoMessage(message); break;
                    case 'error': handleErrorMessage(message); break;
                    default:      console.log("forwarding as event a message with an unknown command: " + message.cmd);
                                  triggerEvent(document, "impressRC:message", {message: message});
                }
            } catch (e) {
                console.log('rc: error: ' + JSON.stringify(e));
            }

        };

        function handleGotoMessage(message) {
            // ignore message sent by myself and echoed by the server
            if (message.self) {
                return;
            }

            // todo react to screen bundle in RC messages somehow?

            console.log('rc: goto "' + message.goto + '"');
            if (impressapi.curr().id != message.goto) {
                impressapi.goto(message.goto, undefined, true);
            } else {
                console.log("rc: already in that step!");
            }
        };

        function handleErrorMessage(message) {
            if ("wrong password" == message.error) {
                // stop sending messages with the wrong password
                impressRCPassword = null;
                console.log("rc: wrong password, stopping sending messages");
                triggerEvent(document, "impressRCPasswordBad");
            }
        };
    }

    var rcForm;
    var rcFormKey;
    var rcFormPassword;
    var rcFormCheckbox1;
    var rcFormViewLink;

    function addKeyPasswordForm() {
        var script = document.currentScript || (function() {
            var scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        if (!script) {
            console.log("cannot add key password form");
            return false;
        }

        rcForm = document.createElement("form");
        rcForm.setAttribute("style",
                "display: none; " +
                "position: fixed; " +
                "font-size: 150%; " +
                "background: #fca; " +
                "color: black; " +
                "left: 1em; " +
                "right: 1em; " +
                "top: 2em; " +
                "padding: 1em 2em; " +
                "text-align: center; " +
                "line-height: 1.8em; " +
                "pointer-events: auto");

        rcForm.onsubmit = rcFormSubmitted;

        rcForm.appendChild(document.createTextNode("Key: "));

        rcFormKey = document.createElement("input");
        rcFormKey.name = "impress-rc-key-field";
        rcFormKey.placeholder = "key";
        rcFormKey.disabled = true;
        rcFormKey.setAttribute("style", "font-size: 100%; background: #fff;");
        rcFormKey.addEventListener("keypress", submitOnEnter, false);

        rcForm.appendChild(rcFormKey);

        rcForm.appendChild(document.createElement("br"));

        rcForm.appendChild(document.createTextNode("Password: "));

        rcFormPassword = document.createElement("input");
        rcFormPassword.name = "impress-rc-pwd-field";
        rcFormPassword.type = "password";
        rcFormPassword.placeholder = "password";
        rcFormPassword.disabled = true;
        rcFormPassword.setAttribute("style", "font-size: 100%; background: #fff;");
        rcFormPassword.addEventListener("keypress", submitOnEnter, false);

        rcForm.appendChild(rcFormPassword);

        rcForm.appendChild(document.createTextNode(" "));

        var el;

        el = document.createElement("input");
        el.name = "impress-rc-pwd-submit";
        el.type = "button";
        el.value = "OK";
        el.setAttribute("style", "font-size: 100%; background: #fff;");
        el.onclick = rcFormSubmitted;
        rcForm.appendChild(el);

        el = document.createElement("label");
        el.setAttribute("style", "font-size: 70%; display: block; margin-top: .5em;");
        rcForm.appendChild(el);

        rcFormCheckbox1 = document.createElement("input");
        rcFormCheckbox1.name = "impress-rc-pwd-checkbox1";
        rcFormCheckbox1.type = "checkbox";
        // default state for the checkbox is in inputRCPassword()
        el.appendChild(rcFormCheckbox1);

        el.appendChild(document.createTextNode(" send RC message to go to the current step"));

        el = document.createElement("button");
        el.type = "button";
        el.setAttribute("style", "color: black; background: #fca; position: absolute; padding: .2em .3em .1em .3em ; margin: .2em; top: 0; right: 0; font-size: 100%");
        el.onclick = impressRCClosePwdDialog;

        el.appendChild(document.createTextNode("X"));

        rcForm.appendChild(el);

        if (typeof(impressRCViewUri) === "function") {
            rcFormViewLink = document.createElement("a");
            rcFormViewLink.setAttribute("style", "font-size: 70%; display: block; margin-top: .5em;");
            updateRCViewLink();
            rcFormKey.oninput = updateRCViewLink;
            rcFormViewLink.appendChild(document.createTextNode("link to remote control view"));
            rcForm.appendChild(rcFormViewLink);
        }

        script.parentElement.insertBefore(rcForm, script);
    }

    function updateRCViewLink() {
        rcFormViewLink.href = impressRCViewUri(rcFormKey.value);
    }

    function submitOnEnter(event) {
        if (event.keyCode == 13) {
            rcFormSubmitted();
            return false;
        }
        return true;
    }

    // update key, password, close form
    function rcFormSubmitted() {
        if (impressRCKey != rcFormKey.value) {
            impressRCKey = rcFormKey.value;
            if ('' == impressRCKey) impressRCKey = null;
            console.log("rc: key updated");
        }
        triggerEvent(document, "impressRCKeySet", impressRCKey);

        impressRCPassword = rcFormPassword.value;
        if ('' == impressRCPassword) impressRCPassword = null;
        triggerEvent(document, "impressRCPasswordSet", impressRCPassword);
        console.log("rc: password updated");

        impressRCClosePwdDialog();
        if (rcFormCheckbox1.checked && impressapi && impressRCPassword) {
            impressapi.goto(impressapi.curr());
        }
        return false;
    }

    document.addEventListener("impressRCKeySet", startWSConnection, false);

    var areImpressJSEventsDisabled = function () { return impressapi && impressapi.disableInputEvents; } ;
    var disableImpressJSEvents = function(flag) { if (impressapi) impressapi.disableInputEvents = flag; } ;

    function impressRCClosePwdDialog() {
        rcForm.style.display = 'none';
        rcFormPassword.value = '';
        rcFormPassword.blur();
        rcFormPassword.disabled = true;
        rcFormKey.blur();
        rcFormKey.disabled = true;
        disableImpressJSEvents(false);
        return false;
    }

    // the parameter will set the default value
    var inputRCPassword = function (checkbox1) {
        if (typeof(checkbox1) === 'undefined') checkbox1 = true;

        rcForm.style.display = 'block';
        rcFormPassword.disabled = false;
        rcFormKey.disabled = false;
        rcFormKey.value = impressRCKey;
        rcFormCheckbox1.checked = !!checkbox1;
        disableImpressJSEvents(true);
        (rcFormKey.value ? rcFormPassword : rcFormKey).focus();
    }

    document.addEventListener("impressRC:openPasswordForm", inputRCPassword, false);


    var recognizedKey = function(keyCode) {
        return keyCode === 80; // 'p'
    }

    // ask for password on pressing 'p'
    document.addEventListener("keyup", function ( event ) {
        if (areImpressJSEventsDisabled()) {
            if (event.keyCode == 27 && !rcFormPassword.disabled) {
                // cancel the password input form
                impressRCClosePwdDialog();
            }
            return;
        }
        if ( recognizedKey(event.keyCode) ) {
            switch( event.keyCode ) {
                case 80: // 'p'
                         inputRCPassword();
                         break;
            }

            event.preventDefault();
        }
    }, false);

    // Prevent default keydown action when one of supported key is pressed.
    document.addEventListener("keydown", function ( event ) {
        if (areImpressJSEventsDisabled()) { return; }
        if ( recognizedKey(event.keyCode) ) {
            event.preventDefault();
        }
    }, false);

})();
