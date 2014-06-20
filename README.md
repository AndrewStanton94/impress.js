impress.js extensions by Jacek Kopecky
============

`impress.js` is a presentation framework based on the power of CSS3 transforms and 
transitions in modern browsers and inspired by the idea behind prezi.com.

The original impress.js library is at [bartaz's repository](http://github.com/bartaz/impress.js)

Changes by Jacek Kopecky
------------

### new features

 - **presenter console** (press `c` in the presentation)

   The presenter console shows speaker notes, current and next step of the
   presentation, wall clock and time since start (clicking on the timer will
   reset it); keys `=` and `-` will make the speaker notes bigger and
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
 
 - (tweak) key [up] goes to step "mainoverview" (if present, else to previous
   step like normal) – this is for good access to presentation overview,
   together with clicking it will then allow quick navigation

### impress.js API changes

 - added **curr()** call in the impress API to return the current step
 - making the API instrumentable (when an API function
               wants to call another (like when next() calls goto()), it will
               call the current one; so you can change the API
 - added **findNext()** to the impress API

### smaller changes

 - (tweak) disabled [tab] key because of interactions with cmd-tab on mac
 - (refactoring) moving list of recognized keys to extra function


LICENSE
---------

Original copyright 2011-2012 Bartek Szopka

Copyright of the changes 2014 Jacek Kopecky

Released under the MIT and GPL (version 2 or later) Licenses.


