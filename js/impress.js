/**
 * impress.js
 *
 * impress.js is a presentation tool based on the power of CSS3 transforms and transitions
 * in modern browsers and inspired by the idea behind prezi.com.
 *
 *
 * Copyright 2011-2012 Bartek Szopka (@bartaz)
 *
 * Released under the MIT and GPL Licenses.
 *
 * ------------------------------------------------
 *  author:  Bartek Szopka, extensions by Jacek Kopecky
 *  version: 0.5.3-jk
 *  url:     http://jacekkopecky.github.com/impress.js/
 *  source:  http://github.com/jacekkopecky/impress.js/
 */

/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, latedef:true, newcap:true,
         noarg:true, noempty:true, undef:true, strict:true, browser:true */

// You are one of those who like to know how things work inside?
// Let me show you the cogs that make impress.js run...
(function ( document, window ) {
    'use strict';

    // HELPER FUNCTIONS

    // `pfx` is a function that takes a standard CSS property name as a parameter
    // and returns its prefixed version valid for current browser it runs in.
    // The code is heavily inspired by Modernizr http://www.modernizr.com/
    var pfx = (function () {

        var style = document.createElement('dummy').style,
            prefixes = 'Webkit Moz O ms Khtml'.split(' '),
            memory = {};

        return function ( prop ) {
            if ( typeof memory[ prop ] === "undefined" ) {

                var ucProp  = prop.charAt(0).toUpperCase() + prop.substr(1),
                    props   = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');

                memory[ prop ] = null;
                for ( var i in props ) {
                    if ( style[ props[i] ] !== undefined ) {
                        memory[ prop ] = props[i];
                        break;
                    }
                }

            }

            return memory[ prop ];
        };

    })();

    // `arraify` takes an array-like object and turns it into real Array
    // to make all the Array.prototype goodness available.
    var arrayify = function ( a ) {
        return [].slice.call( a );
    };

    // `css` function applies the styles given in `props` object to the element
    // given as `el`. It runs all property names through `pfx` function to make
    // sure proper prefixed version of the property is used.
    var css = function ( el, props ) {
        var key, pkey;
        for ( key in props ) {
            if ( props.hasOwnProperty(key) ) {
                pkey = pfx(key);
                if ( pkey !== null ) {
                    el.style[pkey] = props[key];
                }
            }
        }
        return el;
    };

    // `toNumber` takes a value given as `numeric` parameter and tries to turn
    // it into a number. If it is not possible it returns 0 (or other value
    // given as `fallback`).
    var toNumber = function (numeric, fallback) {
        return isNaN(numeric) ? (fallback || 0) : Number(numeric);
    };

    // `byId` returns element with given `id` - you probably have guessed that ;)
    var byId = function ( id ) {
        return document.getElementById(id);
    };

    // `$` returns first element for given CSS `selector` in the `context` of
    // the given element or whole document.
    var $ = function ( selector, context ) {
        context = context || document;
        return context.querySelector(selector);
    };

    // `$$` return an array of elements for given CSS `selector` in the `context` of
    // the given element or whole document.
    var $$ = function ( selector, context ) {
        context = context || document;
        return arrayify( context.querySelectorAll(selector) );
    };

    // `triggerEvent` builds a custom DOM event with given `eventName` and `detail` data
    // and triggers it on element given as `el`.
    var triggerEvent = function (el, eventName, detail) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(eventName, true, true, detail);
        el.dispatchEvent(event);
    };

    // `translate` builds a translate transform string for given data.
    var translate = function ( t ) {
        return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
    };

    // `rotate` builds a rotate transform string for given data.
    // By default the rotations are in X Y Z order that can be reverted by passing `true`
    // as second parameter.
    var rotate = function ( r, revert ) {
        var rX = " rotateX(" + r.x + "deg) ",
            rY = " rotateY(" + r.y + "deg) ",
            rZ = " rotateZ(" + r.z + "deg) ";

        return revert ? rZ+rY+rX : rX+rY+rZ;
    };

    // `scale` builds a scale transform string for given data.
    var scale = function ( s ) {
        return " scale(" + s + ") ";
    };

    // `perspective` builds a perspective transform string for given data.
    var perspective = function ( p ) {
        return " perspective(" + p + "px) ";
    };

    // `getElementFromHash` returns an element located by id from hash part of
    // window location.
    var getElementFromHash = function () {
        // get id from url # by removing `#` or `#/` from the beginning,
        // so both "fallback" `#slide-id` and "enhanced" `#/slide-id` will work
        return byId( window.location.hash.replace(/^#\/?/,"") );
    };

    // `computeWindowScale` counts the scale factor between window size and size
    // defined for the presentation in the config.
    var computeWindowScale = function ( config ) {
        var hScale = window.innerHeight / config.height,
            wScale = window.innerWidth / config.width,
            scale = hScale > wScale ? wScale : hScale;

        if (config.maxScale && scale > config.maxScale) {
            scale = config.maxScale;
        }

        if (config.minScale && scale < config.minScale) {
            scale = config.minScale;
        }

        return scale;
    };

    // CHECK SUPPORT
    var body = document.body;

    var ua = navigator.userAgent.toLowerCase();
    var impressSupported =
                          // browser should support CSS 3D transtorms
                           ( pfx("perspective") !== null ) &&

                          // and `classList` and `dataset` APIs
                           ( body.classList ) &&
                           ( body.dataset ) &&

                          // but some mobile devices need to be blacklisted,
                          // because their CSS 3D support or hardware is not
                          // good enough to run impress.js properly, sorry...
                           ( ua.search(/(iphone)|(ipod)|(android)/) === -1 );

    if (!impressSupported) {
        // we can't be sure that `classList` is supported
        body.className += " impress-not-supported ";
    } else {
        body.classList.remove("impress-not-supported");
        body.classList.add("impress-supported");
    }

    // GLOBALS AND DEFAULTS

    // This is were the root elements of all impress.js instances will be kept.
    // Yes, this means you can have more than one instance on a page, but I'm not
    // sure if it makes any sense in practice ;)
    var roots = {};

    // some default config values.
    var defaults = {
        width: 1024,
        height: 768,
        maxScale: 1,
        minScale: 0,

        perspective: 1000,

        transitionDuration: 1000,

        hashChanges: true,

        screens: [["0"]],
        screen: "0"
    };

    // it's just an empty function ... and a useless comment.
    var empty = function () { return false; };

    // IMPRESS.JS API

    // And that's where interesting things will start to happen.
    // It's the core `impress` function that returns the impress.js API
    // for a presentation based on the element with given id ('impress'
    // by default).
    var impress = window.impress = function ( rootId ) {

        // If impress.js is not supported by the browser return a dummy API
        // it may not be a perfect solution but we return early and avoid
        // running code that may use features not implemented in the browser.
        if (!impressSupported) {
            return {
                init: empty,
                goto: empty,
                prev: empty,
                next: empty,
                curr: empty,
                findNext: empty,
                setScreen: empty,
                currScreen: empty,
                getScreenBundles: empty,
                currScreenBundle: empty,
                verify: empty
            };
        }

        rootId = rootId || "impress";

        // if given root is already initialized just return the API
        if (roots["impress-root-" + rootId]) {
            return roots["impress-root-" + rootId];
        }

        // data of all presentation steps
        var stepsData = {};

        // currently active step
        var activeStep = null;

        // element of currently active step
        var activeStepEl = null;

        // the same as above but for the current multiscreen step (the current step across all screens in the selected screen bundle)
        var activeMultiscreenStepEl = null;
        var activeMultiscreenStep = null;

        // current state (position, rotation and scale) of the presentation
        var currentState = null;

        // array of step elements
        var steps = null;

        // configuration options
        var config = null;

        // scale factor of the browser window
        var windowScale = null;

        // root presentation elements
        var root = byId( rootId );
        var canvas = document.createElement("div");

        var initialized = false;

        // STEP EVENTS
        //
        // There are currently four step events triggered by impress.js
        // `impress:stepenter` is triggered when the step is shown on the
        // screen (the transition from the previous one is finished) and
        // `impress:stepleave` is triggered when the step is left (the
        // transition to next step just starts).
        // `impress:multiscreenstepenter` is triggered when a new multiscreen step is entered
        // regardless of whether the current screen's actual step has changed and
        // `impress:multiscreenstepleave` is triggered when the multiscreen step is left.

        // reference to last entered step
        var lastEntered = null;
        var lastMultiscreenFinalEntered = null;

        // `onStepEnter` is called whenever the step element is entered
        // but the event is triggered only if the step is different than
        // last entered step.
        var onStepEnter = function (step, multiscreenFinalStep) {
            if (lastEntered !== step) {
                triggerEvent(step, "impress:stepenter");
                lastEntered = step;
            }
            if (lastMultiscreenFinalEntered !== multiscreenFinalStep) {
                triggerEvent(multiscreenFinalStep, "impress:multiscreenstepenter");
                lastMultiscreenFinalEntered = multiscreenFinalStep;
            }
        };

        // `onStepLeave` is called whenever the step element is left
        // but the event is triggered only if the step is the same as
        // last entered step.
        var onStepLeave = function (step, multiscreenFinalStep) {
            if (lastEntered === step) {
                triggerEvent(step, "impress:stepleave");
                lastEntered = null;
            }
            if (lastMultiscreenFinalEntered === multiscreenFinalStep) {
                triggerEvent(multiscreenFinalStep, "impress:multiscreenstepleave");
                lastMultiscreenFinalEntered = null;
            }
        };

        /////////////////////////////////////////////////////////////////////////
        // functions for parsing and working with multiscreen information
        var parseScreenBundles = function(screenBundlesString, defaultValue) {
            if (!screenBundlesString) return defaultValue;

            return screenBundlesString.trim().split(/\s+/).map(function(x) {
                return x.split(':');
            })
        }

        var parseStepScreensInto = function(screenString, target) {
            var screens = screenString.trim().split(/\s+/);
            target.screens = [];
            target.multiscreens = [];
            screens.map(function(x) {
                var match = x.match(/^(.*)\*$/);
                if (match) {
                    target.multiscreens.push(match[1]);
                    target.screens.push(match[1]);
                } else {
                    target.screens.push(x);
                }
            })
        }

        // finds the first screen bundle that contains a given screen
        var selectScreenBundle = function(screenBundles, screen) {
            for (var i = 0; i<screenBundles.length; i++) {
                if (screenBundles[i].indexOf(screen) >= 0) return screenBundles[i];
            }
        }

        // a step is a final step in multiple steps that are positioned on multiple screens at the same time if
        // it is in our screen bundle but not as a multiscreen step there
        // note: this will be prettier with Sets when JavaScript 6 is supported
        var isFinalMultiscreenStep = function(step, screenBundle) {
            return arraysIntersect(screenBundle, step.screens) && // on our screen bundle
                   !arraysIntersect(screenBundle, step.multiscreens) // but not as multiscreen step
        };

        var arraysIntersect = function(a1, a2) {
            for (var i=0; i<a1.length; i++) {
                for (var j=0; j<a2.length; j++) {
                    if (a1[i]==a2[j]) return true;
                }
            }
            return false;
        }

        var setScreen = function(screen) {
            var oldScreen = config.screen;

            // if screen is a number, treat it as a position in the list of all declared screens
            if (typeof(screen) === 'number') {
                var allScreens = config.screenBundles.reduce(function(a,b) { return a.concat(b)}, []);
                if (screen >= allScreens.length) screen = 0;
                screen = allScreens[screen];
            }

            // else assume it's a string ID
            config.screen = screen;
            config.screenBundle = selectScreenBundle(config.screenBundles, config.screen);

            if (!config.screenBundle) {
                config.screenBundle = config.screenBundles[0];
                config.screen = config.screenBundle[0];
            }

            body.classList.remove("impress-screen-" + oldScreen);
            body.classList.add("impress-screen-" + config.screen);

            return config.screen;
        }

        var currScreen = function() {
            return config.screen;
        }

        var getScreenBundles = function() {
            return config.screenBundles;
        }

        // returns the declaration of the current screen bundle, in the same
        // format as the data-screeens attribute on an impress root element
        // for example "left:right" or "0"
        var currScreenBundle = function() {
            return config.screenBundle.join(":");
        }

        // end of functions for parsing and working with multiscreen information
        /////////////////////////////////////////////////////////////////////////

        // `initStep` initializes given step element by reading data from its
        // data attributes and setting correct styles.
        var initStep = function ( el, idx ) {
            var data = el.dataset,
                step = {
                    translate: {
                        x: toNumber(data.x),
                        y: toNumber(data.y),
                        z: toNumber(data.z)
                    },
                    rotate: {
                        x: toNumber(data.rotateX),
                        y: toNumber(data.rotateY),
                        z: toNumber(data.rotateZ || data.rotate)
                    },
                    scale: toNumber(data.scale, 1),
                    el: el
                };

            parseStepScreensInto(data.screen || defaults.screen, step);

            if ( !el.id ) {
                el.id = "step-" + (idx + 1);
            }

            // add a list of groups the step belongs to
            if (data.group !== undefined) {
                step.groups = data.group.toString().match(/\S+/g);
            } else {
                step.groups = [];
            }

            // steps data keys always start with "impress-" so as to avoid existing object properties
            stepsData["impress-" + el.id] = step;

            css(el, {
                position: "absolute",
                transform: "translate(-50%,-50%)" +
                           translate(step.translate) +
                           rotate(step.rotate) +
                           scale(step.scale),
                transformStyle: "preserve-3d"
            });
        };

        // `init` API function that initializes (and runs) the presentation.
        var init = function (options) {
            if (initialized) { return; }

            // First we set up the viewport for mobile devices.
            // For some reason iPad goes nuts when it is not done properly.
            var meta = $("meta[name='viewport']") || document.createElement("meta");
            meta.content = "width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no";
            if (meta.parentNode !== document.head) {
                meta.name = 'viewport';
                document.head.appendChild(meta);
            }

            // initialize configuration object
            var rootData = root.dataset;
            config = {
                width: toNumber( rootData.width, defaults.width ),
                height: toNumber( rootData.height, defaults.height ),
                maxScale: toNumber( rootData.maxScale, defaults.maxScale ),
                minScale: toNumber( rootData.minScale, defaults.minScale ),
                perspective: toNumber( rootData.perspective, defaults.perspective ),
                transitionDuration: toNumber( rootData.transitionDuration, defaults.transitionDuration ),
                hashChanges: rootData.hashChanges !== undefined ? rootData.hashChanges :
                             options.hashChanges !== undefined ? options.hashChanges :
                             defaults.hashChanges,
                screenBundles: parseScreenBundles(rootData.screens, defaults.screens),
                options: options
            };

            setScreen(options.screen || defaults.screen);

            windowScale = computeWindowScale( config );

            // wrap steps with "canvas" element
            arrayify( root.childNodes ).forEach(function ( el ) {
                canvas.appendChild( el );
            });
            root.appendChild(canvas);

            // set initial styles
            document.documentElement.style.height = "100%";

            css(body, {
                height: "100%",
                overflow: "hidden"
            });

            var rootStyles = {
                position: "absolute",
                transformOrigin: "top left",
                transition: "all 0s ease-in-out",
                transformStyle: "preserve-3d"
            };

            css(root, rootStyles);
            css(root, {
                top: "50%",
                left: "50%",
                transform: perspective( config.perspective/windowScale ) + scale( windowScale )
            });
            css(canvas, rootStyles);

            body.classList.remove("impress-disabled");
            body.classList.add("impress-enabled");

            // get and init steps
            steps = $$(".step", root);
            steps.forEach( initStep );

            // set a default initial state of the canvas
            currentState = {
                translate: { x: 0, y: 0, z: 0 },
                rotate:    { x: 0, y: 0, z: 0 },
                scale:     1
            };

            initialized = true;

            triggerEvent(root, "impress:init", { api: roots[ "impress-root-" + rootId ] });
        };

        // `getStep` is a helper function that returns a step element defined by parameter.
        // If a number is given, step with index given by the number is returned, if a string
        // is given step element with such id is returned, if DOM element is given it is returned
        // if it is a correct step element.
        var getStep = function ( step ) {
            if (typeof step === "number") {
                step = step < 0 ? steps[ steps.length + step] : steps[ step ];
            } else if (typeof step === "string") {
                step = byId(step);
            }
            return (step && step.id && stepsData["impress-" + step.id]) ? step : null;
        };

        // used to reset timeout for `impress:stepenter` event
        var stepEnterTimeout = null;

        // `goto` API function that moves to step given with `el` parameter (by index, id or element),
        // with a transition `duration` optionally given as second parameter.
        var goto = function ( el, duration ) {

            if ( !initialized || !(el = getStep(el)) ) {
                // presentation not initialized or given element is not a step
                return false;
            }

            // if step `el` is not a multiscreen final step, we'll go to the next step that is.
            var originalEl = el;
            var step = stepsData["impress-" + el.id];
            if (!isFinalMultiscreenStep(step, config.screenBundle)) {
                el = (this && this.findNext || findNext)(el);
                step = stepsData["impress-" + el.id];
            }

            // the currently selected step is the one to goto() for the whole multiscreen bundle
            // this is used in `curr`, `next`, `prev`, and for updating the window location's hash
            var newMultiscreenStepEl = el;
            var newMultiscreenStep = step;

            // if step `el` is not on our screen, we will now find the preceding step that is on it,
            // i.e. one that has our screen among its screens; this step will be displayed
            while (step.screens.indexOf(config.screen) < 0) {
                el = findPrev(el, true);
                step = stepsData["impress-" + el.id];
            }

            // Sometimes it's possible to trigger focus on first link with some keyboard action.
            // Browser in such a case tries to scroll the page to make this element visible
            // (even that body overflow is set to hidden) and it breaks our careful positioning.
            //
            // So, as a lousy (and lazy) workaround we will make the page scroll back to the top
            // whenever slide is selected
            //
            // If you are reading this and know any better way to handle it, I'll be glad to hear about it!
            window.scrollTo(0, 0);

            if ( activeStepEl ) {
                activeStepEl.classList.remove("active");
                body.classList.remove("impress-on-" + activeStepEl.id);
                body.classList.remove("impress-on-" + activeMultiscreenStepEl.id);
                activeStep.groups.forEach(function (group) {
                    body.classList.remove("impress-on-" + group);
                });
                activeMultiscreenStep.groups.forEach(function (group) {
                    body.classList.remove("impress-on-" + group);
                });
            }
            el.classList.add("active");

            body.classList.add("impress-on-" + el.id);
            body.classList.add("impress-on-" + newMultiscreenStepEl.id);

            step.groups.forEach(function (group) {
                body.classList.add("impress-on-" + group);
            });
            newMultiscreenStep.groups.forEach(function (group) {
                body.classList.add("impress-on-" + group);
            });

            // compute target state of the canvas based on given step
            var target = {
                rotate: {
                    x: -step.rotate.x,
                    y: -step.rotate.y,
                    z: -step.rotate.z
                },
                translate: {
                    x: -step.translate.x,
                    y: -step.translate.y,
                    z: -step.translate.z
                },
                scale: 1 / step.scale
            };

            // Check if the transition is zooming in or not.
            //
            // This information is used to alter the transition style:
            // when we are zooming in - we start with move and rotate transition
            // and the scaling is delayed, but when we are zooming out we start
            // with scaling down and move and rotation are delayed.
            var zoomin = target.scale >= currentState.scale;

            duration = toNumber(duration, config.transitionDuration);
            var delay = (duration / 2);

            // if the same step is re-selected, force computing window scaling,
            // because it is likely to be caused by window resize
            if (el === activeStepEl) {
                windowScale = computeWindowScale(config);
            }

            var targetScale = target.scale * windowScale;

            // trigger leave of currently active element (if it's not the same step again)
            if (activeStepEl && activeStepEl !== el) {
                onStepLeave(activeStepEl, activeMultiscreenStepEl);
            }

            // Now we alter transforms of `root` and `canvas` to trigger transitions.
            //
            // And here is why there are two elements: `root` and `canvas` - they are
            // being animated separately:
            // `root` is used for scaling and `canvas` for translate and rotations.
            // Transitions on them are triggered with different delays (to make
            // visually nice and 'natural' looking transitions), so we need to know
            // that both of them are finished.
            css(root, {
                // to keep the perspective look similar for different scales
                // we need to 'scale' the perspective, too
                transform: perspective( config.perspective / targetScale ) + scale( targetScale ),
                transitionDuration: duration + "ms",
                transitionDelay: (zoomin ? delay : 0) + "ms"
            });

            css(canvas, {
                transform: rotate(target.rotate, true) + translate(target.translate),
                transitionDuration: duration + "ms",
                transitionDelay: (zoomin ? 0 : delay) + "ms"
            });

            // Here is a tricky part...
            //
            // If there is no change in scale or no change in rotation and translation, it means there was actually
            // no delay - because there was no transition on `root` or `canvas` elements.
            // We want to trigger `impress:stepenter` event in the correct moment, so here we compare the current
            // and target values to check if delay should be taken into account.
            //
            // I know that this `if` statement looks scary, but it's pretty simple when you know what is going on
            // - it's simply comparing all the values.
            if ( currentState.scale === target.scale ||
                (currentState.rotate.x === target.rotate.x && currentState.rotate.y === target.rotate.y &&
                 currentState.rotate.z === target.rotate.z && currentState.translate.x === target.translate.x &&
                 currentState.translate.y === target.translate.y && currentState.translate.z === target.translate.z) ) {
                delay = 0;
            }

            // store current state
            currentState = target;
            activeStepEl = el;
            activeStep = step;
            activeMultiscreenStepEl = newMultiscreenStepEl;
            activeMultiscreenStep = newMultiscreenStep;

            // And here is where we trigger `impress:stepenter` event.
            // We simply set up a timeout to fire it taking transition duration (and possible delay) into account.
            //
            // I really wanted to make it in more elegant way. The `transitionend` event seemed to be the best way
            // to do it, but the fact that I'm using transitions on two separate elements and that the `transitionend`
            // event is only triggered when there was a transition (change in the values) caused some bugs and
            // made the code really complicated, cause I had to handle all the conditions separately. And it still
            // needed a `setTimeout` fallback for the situations when there is no transition at all.
            // So I decided that I'd rather make the code simpler than use shiny new `transitionend`.
            //
            // If you want learn something interesting and see how it was done with `transitionend` go back to
            // version 0.5.2 of impress.js: http://github.com/bartaz/impress.js/blob/0.5.2/js/impress.js
            window.clearTimeout(stepEnterTimeout);
            stepEnterTimeout = window.setTimeout(function() {
                onStepEnter(activeStepEl, activeMultiscreenStepEl);
            }, duration + delay);

            return activeMultiscreenStepEl;
        };

        // `prev` API function goes to previous step (in document order)
        // in multiscreen setups, it finds the previous step that is final in a multiscreen series of steps (unless overridden by `immediate`)
        // steps with the class 'skip' are skipped
        var findPrev = function(step, immediate) {
            step = step || activeMultiscreenStepEl;
            var prev = steps.indexOf( step );
            if (prev < 0) return steps[0];
            var orig = prev;
            do {
                prev = prev - 1;
                if (prev < 0) { prev = steps.length-1; };
                if (prev === orig) {
                    console.log("ERROR findPrev went full circle");
                    return null;
                }
                step = steps[ prev ];
            } while (step.classList.contains("skip") || !immediate && !isFinalMultiscreenStep(stepsData["impress-" + step.id], config.screenBundle));

            return step;
        }

        var prev = function () {
            return (this && this.goto || goto)(findPrev());
        };

        // `curr` API function returns the current step
        var curr = function() {
            return activeMultiscreenStepEl;
        };

        // `next` API function goes to next step (in document order)
        // in multiscreen setups, it finds the next step that is final in a multiscreen series of steps
        // steps with the class 'skip' are skipped
        var findNext = function(step) {
            step = step || activeMultiscreenStepEl;
            var next = steps.indexOf( step );
            if (next < 0) return steps[0];

            var orig = next;
            do {
                next = next + 1;
                if (next >= steps.length) { next = 0; };
                if (next === orig) {
                    console.log("ERROR findNext went full circle: " + new Error().stack);
                    return null;
                }
                step = steps[ next ];
            } while (step.classList.contains("skip") || !isFinalMultiscreenStep(stepsData["impress-" + step.id], config.screenBundle));
            return step;
        }

        var next = function () {
            var next = (this && this.findNext || findNext)();
            return (this && this.goto || goto)(next);
        };

        var verify = function() {
            var retval = true; // todo return false in case of any error

            console.time("verification");
            try {
                // check that there are only steps and step notes in the impress root
                arrayify( canvas.childNodes ).forEach(function ( el ) {
                        if (el instanceof HTMLElement &&
                            !el.classList.contains("step") &&
                            !el.classList.contains("stepnotes")) {
                            console.log("ERROR impress root contains something (" + el + ") that isn't a step or stepnotes");
                        }
                });

                // prepare regexps for checking screen configs
                var screenBundleRegexp = /^\s*(([0-9a-z_-]+:)*[0-9a-z_-]+\s+)*([0-9a-z_-]+:)*[0-9a-z_-]+\s*$/i;
                var screenRegexp = /^\s*([0-9a-z_-]+\*?\s+)*[0-9a-z_-]+\*?\s*$/i;
                var screenOneRegexp = /^[0-9a-z_-]+$/i;

                // some tests for the regexps
                console.assert( !""            .match(screenBundleRegexp), "assertion error");
                console.assert( !" "           .match(screenBundleRegexp), "assertion error");
                console.assert( !"0* "         .match(screenBundleRegexp), "assertion error");
                console.assert(!!"0"           .match(screenBundleRegexp), "assertion error");
                console.assert(!!"0 1"         .match(screenBundleRegexp), "assertion error");
                console.assert(!!"0 2 1 "      .match(screenBundleRegexp), "assertion error");
                console.assert(!!"0 l:R"       .match(screenBundleRegexp), "assertion error");
                console.assert( !"0 l:"        .match(screenBundleRegexp), "assertion error");
                console.assert( !"0 l/r"       .match(screenBundleRegexp), "assertion error");
                console.assert( !"0^ l:r"      .match(screenBundleRegexp), "assertion error");

                console.assert( !""            .match(screenRegexp), "assertion error");
                console.assert(!!"0"           .match(screenRegexp), "assertion error");
                console.assert(!!"0 1"         .match(screenRegexp), "assertion error");
                console.assert(!!"0 2 1"       .match(screenRegexp), "assertion error");
                console.assert(!!"0* l* R"     .match(screenRegexp), "assertion error");
                console.assert(!!" 0* l* R "   .match(screenRegexp), "assertion error");
                console.assert( !"0 l:r"       .match(screenRegexp), "assertion error");
                console.assert( !"0 l/r"       .match(screenRegexp), "assertion error");
                console.assert( !"0^ l:r"      .match(screenRegexp), "assertion error");
                console.assert( !"0* l* r**"   .match(screenRegexp), "assertion error");

                console.assert( !"0 l/r"       .match(screenOneRegexp), "assertion error");
                console.assert(!!"0"           .match(screenOneRegexp), "assertion error");
                console.assert(!!"r"           .match(screenOneRegexp), "assertion error");
                console.assert(!!"rIGht"       .match(screenOneRegexp), "assertion error");
                console.assert( !"r*"          .match(screenOneRegexp), "assertion error");

                var testVal = {};
                var arrayEqual = function(a,b) {
                    if (a.length != b.length) return false;
                    for (var i = 0; i<a.length; i++) {
                        if (a[i] != b[i]) return false;
                    }
                    return true;
                }
                parseStepScreensInto("0", testVal);      console.assert(arrayEqual(testVal.screens, ["0"]          ) && arrayEqual(testVal.multiscreens, []   ), "assertion error");
                parseStepScreensInto("0* l r", testVal); console.assert(arrayEqual(testVal.screens, ["0", "l", "r"]) && arrayEqual(testVal.multiscreens, ["0"]), "assertion error");

                // check that screens declaration on root is valid
                if ("screens" in root.dataset && !root.dataset.screens.match(screenBundleRegexp))
                    console.log("ERROR screens config malformed: " + root.dataset.screens);

                var allScreens = config.screenBundles.reduce(function(a,b) { return a.concat(b)}, []);

                // check that selected screen is valid
                if (config.options.screen && allScreens.indexOf(config.options.screen) < 0)
                    console.log("ERROR unknown selected screen '" + config.options.screen + "'");

                // check that screen references on steps are valid
                steps.forEach(function(step) {
                    if (!step.dataset.screen.match(screenRegexp))
                        console.log("ERROR step '" + step.id + "' has malformed screen '" + step.dataset.screen + "'");
                    stepsData["impress-" + step.id].screens.map(function(x) {
                        if (allScreens.indexOf(x) < 0)
                            console.log("ERROR step '" + step.id + "' has unknown screen '" + x + "'");
                    });
                });

                if (!config.screen.match(screenOneRegexp))
                    console.log("ERROR selected screen invalid: '" + config.screen + "'");

                // todo from tablet notes:
                // check screen setups
                // that all data-screen, nextscreen etc. make sense
                //   no two adjacent l*, or l* r* if screen config only has "l:r"
                //   overlap in screen bundles/configs?
                //   all screens known/declared
                //   l and l* both on same step, or l and r*
                // posref, xref etc exist, not mine
                // notes before screenskip step if there are other notes before the multi-final step (only a warning)

                // todo check this:
                // a step is a final step in multiple steps that are positioned on multiple screens at the same time if
                // it is in our screen bundle but not as a multiscreen step there
                // this means a step should not be within a single screen bundle both as multiscreen and nonmultiscreen?
                // multiscreen bundle is l:r
                // e.g.         <div id="step42" class="step" data-screen="l* r">
                // it should be <div id="step42" class="step" data-screen="l  r">

                // todo parse screens config into some data structure
                // todo parse each step's screens into an array
                // todo create an array of screens within currently selected screen config (minus current screen)
                // todo check that there is at least one final step in every screen config

            } catch (e) {
                console.log("verification error:", e);
            }
            console.timeEnd("verification");
            console.log("verification done");
        }

        // todo should we always run verify on start?
        root.addEventListener("impress:init", verify, false);

        // Adding some useful classes to step elements.
        //
        // All the steps that have not been shown yet are given `future` class.
        // When the step is entered the `future` class is removed and the `present`
        // class is given. When the step is left `present` class is replaced with
        // `past` class.
        //
        // So every step element is always in one of three possible states:
        // `future`, `present` and `past`.
        //
        // There classes can be used in CSS to style different types of steps.
        // For example the `present` class can be used to trigger some custom
        // animations when step is shown.
        root.addEventListener("impress:init", function(){
            // STEP CLASSES
            steps.forEach(function (step) {
                step.classList.add("future");
            });

            root.addEventListener("impress:stepenter", function (event) {
                event.target.classList.remove("past");
                event.target.classList.remove("future");
                event.target.classList.add("present");
            }, false);

            root.addEventListener("impress:stepleave", function (event) {
                event.target.classList.remove("present");
                event.target.classList.add("past");
            }, false);

        }, false);

        // Adding hash change support.
        root.addEventListener("impress:init", function(event){

            var api = event.detail.api;

            // last hash detected
            var lastHash = "";

            // `#/step-id` is used instead of `#step-id` to prevent default browser
            // scrolling to element in hash.
            //
            // And it has to be set after animation finishes, because in Chrome it
            // makes transtion laggy.
            // BUG: http://code.google.com/p/chromium/issues/detail?id=62820
            if (config.hashChanges) {
                root.addEventListener("impress:multiscreenstepenter", function (event) {
                    window.location.hash = lastHash = "#/" + event.target.id;
                }, false);
            }

            window.addEventListener("hashchange", function () {
                // When the step is entered hash in the location is updated
                // (just few lines above from here), so the hash change is
                // triggered and we would call `goto` again on the same element.
                //
                // To avoid this we store last entered hash and compare.
                if (window.location.hash !== lastHash) {
                    api.goto( getElementFromHash() );
                }
            }, false);

            // START
            // by selecting step defined in url or first step of the presentation
            api.goto(getElementFromHash() || steps[0], 0);
        }, false);

        body.classList.add("impress-disabled");

        // store and return API for given impress.js root element
        return (roots[ "impress-root-" + rootId ] = {
            init: init,
            goto: goto,
            prev: prev,
            next: next,
            curr: curr,
            findNext: findNext,
            setScreen: setScreen,
            currScreen: currScreen,
            getScreenBundles: getScreenBundles,
            currScreenBundle: currScreenBundle,
            verify: verify
        });

    };

    // flag that can be used in JS to check if browser have passed the support test
    impress.supported = impressSupported;

})(document, window);

// NAVIGATION EVENTS

// As you can see this part is separate from the impress.js core code.
// It's because these navigation actions only need what impress.js provides with
// its simple API.
//
// In future I think about moving it to make them optional, move to separate files
// and treat more like a 'plugins'.
(function ( document, window ) {
    'use strict';

    // throttling function calls, by Remy Sharp
    // http://remysharp.com/2010/07/21/throttling-function-calls/
    var throttle = function (fn, delay) {
        var timer = null;
        return function () {
            var context = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    };

    // wait for impress.js to be initialized
    document.addEventListener("impress:init", function (event) {
        // Getting API from event data.
        // So you don't event need to know what is the id of the root element
        // or anything. `impress:init` event data gives you everything you
        // need to control the presentation that was just initialized.
        var api = event.detail.api;

        // this is a flag to disable input events so they don't interfere
        // with in-presentation forms (such as remote-control password, quick
        // questions for the audience, etc.)
        api.disableInputEvents = false;

        // KEYBOARD NAVIGATION HANDLERS

        // Supported keys are:
        // [space] - quite common in presentation software to move forward
        // [right] / [left] - again common and natural addition,
        // [down] - move forward,
        // [up] - go to step with id "mainoverview" (if present, else move back),
        // [pgdown] / [pgup] - often triggered by remote controllers,
        // [tab] - this one is quite controversial, but the reason it ended up on
        //   this list is quite an interesting story... Remember that strange part
        //   in the impress.js code where window is scrolled to 0,0 on every presentation
        //   step, because sometimes browser scrolls viewport because of the focused element?
        //   Well, the [tab] key by default navigates around focusable elements, so clicking
        //   it very often caused scrolling to focused element and breaking impress.js
        //   positioning. The default action is simply disabled.
        var recognizedKey = function(keyCode) {
            return keyCode === 9 ||
                   (keyCode >= 32 && keyCode <= 34) ||
                   (keyCode >= 37 && keyCode <= 40) ||
                   (keyCode >= 49 && keyCode <= 57);
        }

        // Prevent default keydown action when one of supported key is pressed.
        document.addEventListener("keydown", function ( event ) {
            if (api.disableInputEvents) { return; }
            if ( recognizedKey(event.keyCode) ) {
                event.preventDefault();
            }
        }, false);

        // Trigger impress action (next or prev) on keyup.
        document.addEventListener("keyup", function ( event ) {
            if (api.disableInputEvents) { return; }
            if ( recognizedKey(event.keyCode) ) {
                switch( event.keyCode ) {
                    case 33: // pg up
                    case 37: // left
                             api.prev();
                             break;
                    case 38: // up
                             api.goto("mainoverview") || api.prev();
                             break;
                    case 9:  // tab key disabled
                             break;
                    case 32: // space
                    case 34: // pg down
                    case 39: // right
                    case 40: // down
                             api.next();
                             break;
                    case 49: // 1
                    case 50: // 2
                    case 51: // 3
                    case 52: // 4
                    case 53: // 5
                    case 54: // 6
                    case 55: // 7
                    case 56: // 8
                    case 57: // 9
                             var scr = api.setScreen(event.keyCode-49);
                             api.goto(api.curr());
                             window.alert("current presentation screen set to '" + scr + "'");
                             break;
                }

                event.preventDefault();
            }
        }, false);

        // delegated handler for clicking on the links to presentation steps
        document.addEventListener("click", function ( event ) {
            if (api.disableInputEvents) { return; }

            // event delegation with "bubbling"
            // check if event target (or any of its parents is a link)
            var target = event.target;
            while ( (target.tagName !== "A") &&
                    (target !== document.documentElement) ) {
                target = target.parentNode;
            }

            if ( target.tagName === "A" ) {
                var href = target.getAttribute("href");

                // if it's a link to presentation step, target this step
                if ( href && href[0] === '#' ) {
                    target = document.getElementById( href.slice(1) );
                }

                if ( api.goto(target) ) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                }
            }
        }, false);

        // delegated handler for clicking on step elements
        document.addEventListener("click", function ( event ) {
            if (api.disableInputEvents) { return; }

            var target = event.target;
            // find closest step element that is not active
            while ( !(target.classList.contains("step") && !target.classList.contains("active")) &&
                    (target !== document.documentElement) ) {
                target = target.parentNode;
            }

            if ( target !== document.documentElement && api.goto(target) ) {
                event.preventDefault();
            }
        }, false);

        // touch handler to detect taps on the left and right side of the screen
        // based on awesome work of @hakimel: https://github.com/hakimel/reveal.js
        document.addEventListener("touchstart", function ( event ) {
            if (api.disableInputEvents) { return; }

            if (event.touches.length === 1) {
                var x = event.touches[0].clientX,
                    width = window.innerWidth * 0.3,
                    result = null;

                if ( x < width ) {
                    result = api.prev();
                } else if ( x > window.innerWidth - width ) {
                    result = api.next();
                }

                if (result) {
                    event.preventDefault();
                }
            }
        }, false);

        // rescale presentation when window is resized
        window.addEventListener("resize", throttle(function () {
            // force going to active step again, to trigger rescaling
            api.goto( api.curr(), 500 );
        }, 250), false);

    }, false);

})(document, window);

// THAT'S ALL FOLKS!
//
// Thanks for reading it all.
// Or thanks for scrolling down and reading the last part.
//
// I've learnt a lot when building impress.js and I hope this code and comments
// will help somebody learn at least some part of it.
