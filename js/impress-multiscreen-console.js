/**
 * impress-multiscreen-console.js
 *
 * impress-multiscreen-console.js is a multiscreen console for impress.js,
 * it shows screen bundles as side-by-side screens
 *
 * open it either by pressing 's' in the presentation, or by adding a URI query parameter multiscreenConsole
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

    var impressapi;
    var query = parseQueryParams();

    var bundle = 0;
    if (query.bundle) bundle = query.bundle[0];

    // this will open a new window with the presenter console
    var openMultiscreenConsole = function () {
        if (!impressapi) {
            console.log("cannot open multiscreen console before we have the API");
            return;
        }
        var uri = window.location.toString();
        var fragpos = uri.indexOf("#");
        if (fragpos >= 0) {
            uri = uri.substring(0,fragpos);
        }
        var querypos = uri.indexOf("?");
        if (querypos >= 0) {
            uri = uri.substring(0,querypos);
        }
        window.location.assign(
            "js/impress-multiscreen-console.html?uri=" + encodeURIComponent(uri) +
            "&screens=" + encodeURIComponent(JSON.stringify(impressapi.getScreenBundles())) +
            "&bundle=" + bundle);
    }

    // get impress API and open console if there's a query parameter multiscreenConsole
    document.addEventListener("impress:init", function (event) {
        impressapi = event.detail.api;
        if (query.multiscreenConsole) setTimeout(openMultiscreenConsole, 100);
    }, false);

    var recognizedKey = function(keyCode) {
        return keyCode === 83;
    }

    var areImpressJSEventsDisabled = function () { return impressapi && impressapi.disableInputEvents; } ;

    document.addEventListener("keydown", function ( event ) {
        if (areImpressJSEventsDisabled()) return;
        if ( recognizedKey(event.keyCode) ) {
            event.preventDefault();
        }
    }, false);

    // Trigger console action (open) on keyup.
    document.addEventListener("keyup", function ( event ) {
        if (areImpressJSEventsDisabled()) return;
        if ( recognizedKey(event.keyCode) ) {
            switch( event.keyCode ) {
                case 83: // s - multiscreen console
                         openMultiscreenConsole();
                         break;
            }

            event.preventDefault();
        }
    }, false);
})(document, window);




