impress.js extensions by Jacek Kopecky
============

`impress.js` is a presentation framework based on the power of CSS3 transforms
and transitions in modern browsers and inspired by the idea behind prezi.com.

The original impress.js library is at
[bartaz's repository](http://github.com/bartaz/impress.js)

Changes by Jacek Kopecky
------------

### new features

  - **remote control** (press `p` in the presentation)

    For controlling a presentation from another device, the remote control
    script opens a WebSocket channel to an impress-server (see
    https://github.com/jacekkopecky/impress-server) presumed running on the
    machine that served the presentation files.

    The remote control shows speaker notes (see below), the IDs of the
    current and next step, wall clock and time since start, and of course big
    buttons for going to the next or previous step. Keys `=` and `-` or the
    buttons `+` and `-` will make the speaker notes bigger and smaller.
    Clicking/tapping the time display will reset it. Clicking/tapping the
    next-step ID will open a list of all IDs for quick jumping around in the
    presentation.

    You can try it at http://jacek.soc.port.ac.uk/presentations/impress.js
    (tested on a mac with firefox and chrome; doesn't seem to work in safari and
    I don't really know why):

      1. open the presentation in two browser windows
         (possibly one on a presenting machine and another on a mobile device);
         the two windows are (for now) independent of each other
      2. in one window, press `p`, fill in some key (e.g. `abc`) - this window
         is now remote-controlled
      3. in the other window, press `o` to open the remote control view; in the
         new view then fill in the same key `abc` and some password (the server
         uses the first password it sees for any given combination of
         presentation and key)
      4. press space or the » button a few times and watch as the remote control
         view now controls the presentation in the first window
      5. any window with this presentation and this key will be controlled by
         that remote control; the order of opening the conroller and the
         controlled windows doesn't matter; in fact any presentation that
         has the right password will control the others

    You can press `p` in a presentation or in the remote control to be able to
    set the presentation key (the same presentation can be given in multiple
    places independently if the places use different RC keys). Setting also the
    password means the presentation will now forward all next()/prev()/goto()
    events to all listening presentations.

  - **presenter console** (press `c` in the presentation)

    The presenter console shows speaker notes (see below), current and next
    step of the presentation, wall clock and time since start (clicking on the
    timer will reset it), and the current screen ID. Keys `=` and `-` will make
    the speaker notes bigger and smaller.

    Open the presenter console by pressing `c`, then move the new browser
    tab/window on your laptop screen while the presentation is on the
    projector.

    You can think of the presenter console as a remote control running on the
    same machine and not needing any server.

  - **speaker notes**

    For any step, you can put notes for yourself (or anybody who's presenting
    the presentation) in `<div class='stepnotes'>...</div>` preceding that step;
    these notes show up in the presenter console or in the remote control.

  - **multiscreen support**

   You can have a single presentation spanning multiple screens (either with
   coordination over open tabs or with coordination over a websockets
   `impress-server`).

   To select the presentation screen of the current window,
   either put "screen=id" in the query of the URI, or press `1`-`9` to select
   one of the first 9 declared screens.
        
   In a presentation, the body element gets the class based on active screen
   name `impress-screen-NAME` (where NAME is the screen's name)... For
   example when showing the "right" screen, the body element gets a class of
   `impress-screen-right`. This can be used by the CSS for example to hide
   some content that shouldn't be getting in the way on some screens.

   Also, in a presentation, when a screen shows a step different from the
   one that is the final in a set of screens shown together, the body gets
   `impress-on-ID` classes from both steps.

   There is also a multiscreen console (opened by pressing `s` in a presentation)
   which allows you to preview the various screen configurations in a single
   browser window.

   If I haven't created a YouTube screencast already, bug me about it.

  - **radial positioning**

    By default, impress.js lets you position steps on X,Y,Z coordinates. Now
    it can also do positioning by a given distance at a given angle from
    a given point.

    For example, a step with `data-x="1000" data-y="2000" data-r="3000" data-angle="45"`
    would get positioned 3000 pixels north-east (up-right) from a point at 1000x2000 pixels.
    This is useful if we want to put steps around something.

    These are all the new attributes:

    * `data-r` - the radius
    * `data-angle` and `data-angle-z` for angle around Z-axis, clockwise from top
    * `data-angle-x` and `data-angle-y` for angle around X-axis or Y-axis 

    Only one of these angle attributes is used; it's the first one that is
    present in this sequence: data-angle-x, data-angle-y, data-angle-z, data-angle.

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

  - **custom step perspective**

    sometimes you may want to affect a step's perspective, use
    data-perspective="number" for that, the resulting perspective is the
    default multiplied by the number

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
 - added **getScreenBundles()** to retrieve known screen bundles

### smaller changes

 - (tweak) disabled [tab] key because of interactions with cmd-tab on mac
 - (refactoring) moving list of recognized keys to extra function
 - (fix) scaling the window should not affect the perspective - the position of the camera


LICENSE
---------

Original copyright of impress.js 2011-2014 Bartek Szopka

Copyright of the changes 2014 Jacek Kopecky

Released under the MIT and GPL (version 2 or later) Licenses.
