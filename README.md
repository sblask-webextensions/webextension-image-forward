[![Build Status](https://travis-ci.org/sblask/firefox-image-forward.svg?branch=master)](https://travis-ci.org/sblask/firefox-image-forward)

firefox-image-forward
=====================

A firefox extension to easily look through images on a page or images linked
from a page.
Inspired by parts of Opera 12's Fast Forward.
(You can use
[Space Next](https://addons.mozilla.org/en-US/firefox/addon/space-next/)
to get the rest of its functionality)


Introduction
------------

You can use `Ctrl Shift Space` to iterate through embedded images on for
example [The Big Picture](http://www.boston.com/bigpicture/) (so you also see
them one by one and centered nicely instead of where you scrolled to) and `Ctrl
Space` to iterate through the images linked on for example [reddit's wallpaper
topic](https://www.reddit.com/r/wallpaper) (to avoid clicking, going back,
clicking...).  Once you've reached the end, the index page will be loaded
again.

Similar extensions are:

 - [Browse Images](https://addons.mozilla.org/en-US/firefox/addon/browse-images/)
 - [Full Screen Image Viewer](https://addons.mozilla.org/en-US/firefox/addon/full-screen-image-viewer/)

This extension aims at providing the same functionality(apart from an
automatic slideshow) in a much simpler and reliable way by using as little
custom functionality as possible.

Usage
-----

 - Pressing `Ctrl Space` and `Ctrl Shift Space` will cause `Image Forward` to
   try to extract image URLs from the current page. If there are any, the tab
   is set into iteration mode and the first image is loaded. Pressing them
   again will load the next one. `Ctrl Shift B` ends the iteration mode
   and loads the initial page.
 - For fullscreen, simply press F11 to enable the browser's native fullscreen
   functionality
 - You can use the back/forward browser functionality to go one image back at
   a time and then again forward until you reached the last image loaded with
   the above keyboard shortcuts. If there are many images on on a page, you
   might have to adjust `browser.sessionhistory.max_entries` to make this
   work as this setting effectively restricts the times you can go back in
   history. If you go back beyond the first image or load a new page, the
   iteration mode is ended.

Customization
-------------

 - See the add-on's preferences for all the options
 - Image links are simply loaded as if they where clicked upon, embedded
   pictures as if you'd have used `View Image` from context menu. Thus,
   you can combine `Image Forward` with other extensions like
   [ImageZoom](https://addons.mozilla.org/en-US/firefox/addon/image-zoom/).

Feedback
--------

You can report bugs or make feature requests on
[Github](https://github.com/sblask/firefox-image-forward).

Patches are welcome.
