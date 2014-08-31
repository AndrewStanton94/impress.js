impress.js extensions by Jacek Kopecky
============

`impress.js` is a presentation framework based on the power of CSS3 transforms and
transitions in modern browsers and inspired by the idea behind prezi.com.

The original impress.js library is at [bartaz's repository](http://github.com/bartaz/impress.js)

Changes by Jacek Kopecky
------------

### new features

 - **multiscreen support**

   You can have a single presentation spanning multiple screens (either with
   coordination over open tabs or with coordination over a websockets
   `impress-server`).

   To select the presentation screen of the current window,
   either put "screen=id" in the query of the URI, or press '0'-'9' to select
   one of the first 10 declared screens.

   If I haven't created a YouTube screencast already, bug me about it.

 - **presenter console** (press `c` in the presentation)

   The presenter console shows speaker notes, current and next step of the
   presentation, wall clock and time since start (clicking on the timer will
   reset it), and the current screen ID. Keys `=` and `-` will make the speaker notes bigger and
   smaller.

   Open the presenter console by pressing `c`, then move the new browser
   tab/window on your laptop screen while the presentation is on the
   projector.

 - **step groups useful for styling** (e.g. for showing whole groups
   of steps when one of them is active)

   example: in normal impress.js, if the current step has `id="a"`, the body
   will have the class `impress-on-a`; with groups, if the current step
   also has `data-group="b c"`, the body will have the classes `impress-on-b`
   and `impress-on-c` as well

 - **skipped steps** (steps with the class `skip`)

   this is useful to have content positioned by impress.js (with data-x,
   data-y etc.) but not constituting a step – e.g. when there is a big
   picture where various steps zoom in on parts of it

 - (tweak) key [up] goes to step with id "**mainoverview**" (if present, else
   to previous step like normal) – this is for good access to presentation
   overview, together with clicking it will then allow quick navigation

 - **blank steps** (added in demo CSS)

   because sometimes it's useful in a presentation to hide everything and
   just talk

### impress.js API changes

 - added **curr()** call in the impress API to return the current step
 - making the API instrumentable (when an API function
   wants to call another (like when next() calls goto()), it will
   call the current one; so you can change the API)
 - added **findNext()** to the impress API
 - added API flag to disable input events, e.g. when remote control shows
   password input field
 - added **`options`** to init(), currently only with **hashChanges** -
   make it false to disable URI changes while presenting (so that Firefox on
   Mac in fullscreen with hidden location bar doesn't show the location bar
   on every step)
 - added **setScreen(screen)** to set the current screen in a multi-screen setup
 - added **currScreen()** to retrieve the current screen

### smaller changes

 - (tweak) disabled [tab] key because of interactions with cmd-tab on mac
 - (refactoring) moving list of recognized keys to extra function


LICENSE
---------

Original copyright 2011-2012 Bartek Szopka

Copyright of the changes 2014 Jacek Kopecky

Released under the MIT and GPL (version 2 or later) Licenses.
