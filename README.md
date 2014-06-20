impress.js extensions by Jacek Kopecky
============

`impress.js` is a presentation framework based on the power of CSS3 transforms and 
transitions in modern browsers and inspired by the idea behind prezi.com.

The original impress.js library is at [bartaz's repository](http://github.com/bartaz/impress.js)

Changes by Jacek Kopecky
------------

### New features

 - 2014-07-20: presenter console (press 'c' in the presentation)

### impress.js API changes

 - 2014-07-20: (api) added curr() call in the impress API to return the current step
 - 2014-07-19: (api) making the API instrumentable (when an API function
               wants to call another (like when next() calls goto()), it will
               call the current one; so you can change the API
 - 2014-07-19: (api) added findNext() to the impress API

### smaller changes

 - 2014-07-19: (tweak) disabled [tab] key because of interactions with cmd-tab on mac
 - 2014-07-19: (editorial) moving list of recognized keys to extra function


LICENSE
---------

Original copyright 2011-2012 Bartek Szopka
Copyright of the changes 2014 Jacek Kopecky

Released under the MIT and GPL (version 2 or later) Licenses.


