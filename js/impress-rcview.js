/**
 * impress-rcview.js
 *
 * impress-rcview.js is a script for impress.js presentations that adds a keyboard shortcut
 * to switch to a remote-control (RC) view.
 * It triggers if the user presses 'o' or if an impress presentation is called
 * with 'rcview' in its query string for example: http://example.com/impress.html?rcview
 * For more information about the remote control, see impress-rc.js.
 *
 * todo merge this into impress-rc.js, but disable it when used in impress-rcview.html
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

var impressRCViewUri;

(function() {
    'use strict';

    // can use parseQueryParams from queryparams.js
    var query = {};

    if (parseQueryParams) query = parseQueryParams();

    var key = null;
    if (query.key) key = query.key[0];

    impressRCViewUri = function (key) {
        // put the uri and the key (if any) as parameters for the rcview page
        var uri = "js/impress-rcview.html?uri=" + encodeURIComponent(window.location);

        if (key) {
            uri = uri + "&key=" + encodeURIComponent(key);
        }

        return uri;
    }

    var switchToRCView = function() {

        var uri = impressRCViewUri(key);

        // timeout to make sure the redirect works
        setTimeout(function(){window.location.assign(uri);},100);
        return uri;
    }

    if (query.rcview) {
        // try to prevent impress functionality just so it doesn't initialize needlessly
        var root = document.getElementById("impress");
        if (root) root.parentElement.removeChild(root);

        document.open();
        document.write("<p>switching to remote control view</p>");
        document.close();

        var uri = switchToRCView();

        document.open();
        document.write("<p>you can go there by <a href='" + uri + "'>clicking here</a></p>");
        document.close();
        return;
    }

    // integration with impress.js, so that 'o' doesn't get triggered when we don't want it

    var areImpressJSEventsDisabled = function() { return false; };
    document.addEventListener("impress:init", function (event) {
        var impressapi = event.detail.api;
        areImpressJSEventsDisabled = function () { return impressapi.disableInputEvents; } ;
    });

    var recognizedKey = function(keyCode) {
        return keyCode === 79; // 'o'
    }

    // Prevent default keydown action when one of supported key is pressed.
    document.addEventListener("keydown", function ( event ) {
        if (areImpressJSEventsDisabled()) { return; }
        if ( recognizedKey(event.keyCode) ) {
            event.preventDefault();
        }
    }, false);

    // switch to remote controller view on pressing o
    document.addEventListener("keyup", function ( event ) {
        if (areImpressJSEventsDisabled()) { return; }
        if ( recognizedKey(event.keyCode) ) {
            switch( event.keyCode ) {
                case 79: // 'o'
                         if (window.confirm("switch to remote controller view?")) {
                             switchToRCView();
                         }
                         break;
            }
            event.preventDefault();
        }
    }, false);

    document.addEventListener("impressRCKeySet", function (event) {
        key = event.detail;
    }, false);

})();
