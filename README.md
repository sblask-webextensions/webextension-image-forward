firefox-image-forward
=====================

A firefox extension for easy cycling through images and image links on a page.
Inspired by parts of Opera 12's fast forward.
(You can use
[Space Next](https://addons.mozilla.org/en-US/firefox/addon/space-next/)
to get the rest of its functionality)


Introduction
------------

You can use `Ctrl Shift Space` to iterate through embedded images on for example
[The Big Picture](http://www.boston.com/bigpicture/)
and `Ctrl Space` to iterate through the images linked on for example
[Desktop Wallpaper](http://hddesktopwallpaperblog.blogspot.se/2012/06/nature-wallpaper.html).
Once you've reached the end, the index page will be loaded again.

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

 - You can configure the keyboard shortcuts using the
   [Customizable Shortcuts extension](https://addons.mozilla.org/en-US/firefox/addon/customizable-shortcuts/).
 - You can use mouse gestures with for example
   [FireGestures](https://addons.mozilla.org/en-US/firefox/addon/firegestures/)
   where you can hook up
   `gImageForward.iterateImages()`,
   `gImageForward.iterateImageLinks()` and
   `gImageForward.abortIteration()`
 - You can use `about:config` to modify
   `extensions.imageforward.linkURLRegExp` to control which links count as
   images. To not include 1 pixel images or other small images when cycling
   through embedded images, there is a setting for minimum width and height:
   `extensions.imageforward.minHeight` and `extensions.imageforward.minWidth`
   (doesn't effet cycling through image links as their size is unknown before
   loading them).
 - Image links are simply loaded as if they where clicked upon, embedded
   pictures as if you'd have used `View Image` from context menu. Thus,
   you can combine `Image Forward` with other extensions like
   [ImageZoom](https://addons.mozilla.org/en-US/firefox/addon/image-zoom/).

Feedback
--------

You can report bugs or make feature requests on
[Github](https://github.com/sblask/firefox-image-forward).

Patches are welcome.

Installation
------------

To install from source, create a link
`~/.mozilla/firefox/$RANDOM_PROFILE_ID/extensions/imageforward@sblask`
to your checkout folder.

