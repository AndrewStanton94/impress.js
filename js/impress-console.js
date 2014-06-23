/**
 * impress-console.js
 *
 * impress-console.js is a presenter console for impress.js, inspired by
 * PowerPoint presenter view
 *
 *
 * Copyright 2014 Jacek Kopecky
 *
 * Released under the MIT and GPL Licenses.
 *
 * ------------------------------------------------
 *  author:  Jacek Kopecky
 *  version: 0.1
 *  source:  http://github.com/jacekkopecky/impress.js/
 */

(function ( document, window ) {
    'use strict';

    // window/tab with the presenter console
    var presenterConsole = null;

    var impressapi;

    // this will open a new window with the presenter console
    var openPresenterConsole = function () {
        // when the presenter console is properly loaded, we need to initialize it
        // this is a callback that will be invoked by the script running in
        // the presenter console tab/window

        window.impressPresenterConsoleInit = function() {
            window.impressConsoleSetup(window.location);
            impressapi.goto(impressapi.curr());
        }
        presenterConsole = window.open("js/impress-console.html");
    }

    // get impress API
    // orchestrate impress goto() to also let the console know
    document.addEventListener("impress:init", function (event) {
        impressapi = event.detail.api;
        var oldgoto = impressapi.goto;

        impressapi.goto = function ( el, duration ) {
            var step = oldgoto(el, duration);
            if (!step) {
                console.error("error going to step " + el);
                return step;
            }

            // tell console that it too should move to this new step
            if ("impressConsoleGoto" in window) {
                window.impressConsoleGoto(step, impressapi.findNext());
            } else if (presenterConsole != null) {
                console.error("no impressConsoleGoto");
            }
            return step;
        };
    }, false);

    var recognizedKey = function(keyCode) {
        return keyCode === 67 || keyCode === 187 || keyCode === 189;
    }

    document.addEventListener("keydown", function ( event ) {
        if ( recognizedKey(event.keyCode) ) {
            event.preventDefault();
        }
    }, false);

    // Trigger console action (open, notes size) on keyup.
    document.addEventListener("keyup", function ( event ) {
        if ( recognizedKey(event.keyCode) ) {
            switch( event.keyCode ) {
                case 187: // plus (or equals)
                         window.impressConsoleNotesBigger();
                         break;
                case 189: // minus
                         window.impressConsoleNotesSmaller();
                         break;
                case 67: // c - presenter console
                         openPresenterConsole();
                         break;
            }

            event.preventDefault();
        }
    }, false);

    // if we have ?nodelay in the URI, override the presentation's transition delay
    // this call requires queryparams.js
    var query = parseQueryParams();

    if (query.nodelay) {
        console.log("overriding transition delay for the presentation");
        document.getElementById("impress").dataset.transitionDuration=0;
    }
})(document, window);




