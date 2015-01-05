/**
 * impress-formsview.js
 *
 * impress-formsview.js is a script for impress.js presentations that adds a keyboard shortcut
 * to switch to a forms view - a view that only shows the forms from the presentation.
 * It triggers if the user presses 'f' or if an impress presentation is called
 * with 'formsview' in its query string for example: http://example.com/impress.html?formsview
 * For more information about the remote control, see forms.html.
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

(function() {
    'use strict';

    // can use parseQueryParams from queryparams.js
    var query = {};

    if (parseQueryParams) query = parseQueryParams();

    var key = null;
    var bundle = null;
    if (query.key) key = query.key[0];
    if (query.bundle) bundle = query.bundle[0];

    var impressFormsViewUri = function (key, bundle) {
        // put the uri and the key (if any) as parameters for the formsview page
        var uri = "js/impress-formsview.html?uri=" + encodeURIComponent(window.location);

        if (key) {
            uri = uri + "&key=" + encodeURIComponent(key);
        }

        return uri;
    }

    var switchToFormsView = function() {

        var uri = impressFormsViewUri(key, bundle);

        // timeout to make sure the redirect works
        setTimeout(function(){window.location.assign(uri);},100);
        return uri;
    }

    if (query.formsview) {
        // try to prevent impress functionality just so it doesn't initialize needlessly
        var root = document.getElementById("impress");
        if (root) root.parentElement.removeChild(root);

        document.open();
        document.write("<p>switching to forms view</p>");
        document.close();

        var uri = switchToFormsView();

        document.open();
        document.write("<p>you can go there by <a href='" + uri + "'>clicking here</a></p>");
        document.close();
        return;
    }

    // integration with impress.js, so that 'f' doesn't get triggered when we don't want it

    var areImpressJSEventsDisabled = function() { return false; };
    document.addEventListener("impress:init", function (event) {
        var impressapi = event.detail.api;
        areImpressJSEventsDisabled = function () { return impressapi.disableInputEvents; } ;
    });

    var recognizedKey = function(keyCode) {
        return keyCode === 70; // 'f'
    }

    // Prevent default keydown action when one of supported key is pressed.
    document.addEventListener("keydown", function ( event ) {
        if (areImpressJSEventsDisabled()) { return; }
        if ( recognizedKey(event.keyCode) ) {
            event.preventDefault();
        }
    }, false);

    // switch to remote controller view on pressing f
    document.addEventListener("keyup", function ( event ) {
        if (areImpressJSEventsDisabled()) { return; }
        if ( recognizedKey(event.keyCode) ) {
            switch( event.keyCode ) {
                case 70: // 'f'
                         if (window.confirm("switch to forms view?")) {
                             switchToFormsView();
                         }
                         break;
            }
            event.preventDefault();
        }
    }, false);

    document.addEventListener("impressFormsKeySet", function (event) {
        key = event.detail;
    }, false);

})();
