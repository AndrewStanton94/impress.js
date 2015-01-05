/**
 * impress-forms.js
 *
 * impress-forms.js is an extension of the impress.js remote control that sends
 * form data over remote control; it instruments forms that have the class
 * rc-interactive.
 *
 * Copyright 2015- Jacek Kopecky
 *
 * Released under the MIT and GPL Licenses.
 *
 * ------------------------------------------------
 *  author:  Jacek Kopecky
 *  version: 0.0.1
 *  source:  http://github.com/jacekkopecky/impress.js/
 */
(function(){
    'use strict';

    function instrumentForms(event) {

        var api = event.detail.api;

        console.log("instrumenting forms: " + document.forms.length);

        for (var i=0; i<document.forms.length; i++) {
            var form = document.forms[i];
            if (form.classList.contains("rc-interactive")) {
                // instrument the inputs of this form
                // so that onChange submits the form's data over RC
                for (var j=0; j<form.elements.length; j++) {
                    var input = form.elements[j];
                    input.addEventListener('change', submitForm);
                    console.log(input);
                }
            }
        }

        var resetButtons = document.querySelectorAll('.form-reset');
        for (i=0; i<resetButtons.length; i++) {
            resetButtons[i].addEventListener('click', resetForms);
        }

        function submitForm(event) {
            var form = event.target.form;

            var message = { cmd: "form-data", form: form.id, data: {}};

            for (var i=0; i<form.elements.length; i++) {
                var input = form.elements[i];

                if (input.disabled ||
                    !input.name ||
                    input.type === 'reset' ||
                    input.type === 'submit' ||
                    ((input.type === 'checkbox' || input.type === 'radio') && !input.checked)) continue;

                if (input.name in message.data) {
                    message.data[input.name] = [].concat(message.data[input.name], input.value);
                } else {
                    message.data[input.name] = input.value;
                }
            }

            console.log('sending the following data: ' + JSON.stringify(message, null, 2));
            if (!api.rcSend) {
                console.log("error: api.rcSend() not available, form not submitted");
            } else {
                api.rcSend(message);
            }
        }

        function resetForms(event) {
            var form = event.target.dataset.form;
            var message = { cmd: "reset-form", form: form};
            if (!api.rcSend) {
                console.log("error: api.rcSend() not available, form not reset");
            } else {
                api.rcSend(message);
            }
        }

        document.addEventListener('impressRC:message', receivedMessage);

        function receivedMessage(event) {
            var message = event.detail.message;
            if (!message.cmd) return;

            if (message.cmd === "form-data") {
                var form = document.getElementById(message.form);
                if (!form || form.tagName !== "FORM") return;

                triggerEvent(form, 'newRCData', event.detail);

            } else if (message.cmd === "reset-form") {

                var form = document.getElementById(message.form);
                if (!form || form.tagName !== "FORM") return;

                form.reset();

            } else if (message.cmd === "client-gone") {

                for (var i=0; i<document.forms.length; i++) {
                    var form = document.forms[i];
                    if (form.classList.contains("rc-interactive")) {
                        // instrument the inputs of this form
                        // so that onChange submits the form's data over RC
                        triggerEvent(form, 'clientGone', event.detail);
                    }
                }
            }
        }

        // tool function from impress
        var triggerEvent = function (el, eventName, detail) {
            var event = document.createEvent("CustomEvent");
            event.initCustomEvent(eventName, true, true, detail);
            el.dispatchEvent(event);
        };

    };

    document.addEventListener('impress:init', instrumentForms);
    document.addEventListener('impressRC:init', instrumentForms);

})();
