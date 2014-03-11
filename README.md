firefox-image-forward
=====================

A firefox extension for easy cycling through images and image links on a page.
You can use `Ctrl Shift Space` to iterate through embedded images on for example
[The Big Picture](http://www.boston.com/bigpicture/)
and `Ctrl Space` to iterate through the images linked on for example
[Desktop Wallpaper](http://hddesktopwallpaperblog.blogspot.se/2012/06/nature-wallpaper.html)

Inspired by parts of Opera 12's fast forward.
(You can use
[Space Next](https://addons.mozilla.org/en-US/firefox/addon/space-next/)
to get the rest of its functionality)

Similar extensions are:

 - [Browse Images](https://addons.mozilla.org/en-US/firefox/addon/browse-images/)
 - [Full Screen Image Viewer](https://addons.mozilla.org/en-US/firefox/addon/full-screen-image-viewer/)

This extension aims at providing the same functionality(apart from an
automatic slideshow) in a much simpler and reliable way by using as little
custom functionality as possible:

 - There are only 3 custom keyboard shortcuts, `Ctrl Space` for cycling
   through image links, `Ctrl Shift Space` for cycling through embedded
   images and `Ctrl Shift Escape` to go back to the web page images. All three
   are configurable using the
   [Customizable Shortcuts extension](https://addons.mozilla.org/en-US/firefox/addon/customizable-shortcuts/).
   (the corresponding functionality is provided by
   gImageForward.iterateImages(),
   gImageForward.iterateImageLinks and
   gImageForward.abortIteration()
   which you can call for example using
   [FireGestures](https://addons.mozilla.org/en-US/firefox/addon/firegestures/))
 - Image links are simply loaded as if they where clicked upon, embedded
   pictures as if you'd have used `View Image` from context menu. Thus,
   you can combine `Image Forward` with other extension to enhance their
   display.
 - You can use `about:config` to modify
   `extensions.imageforward.linkURLRegExp` to control which links count as
   images. To avoid getting 1 pixel images or other irrelevant images, you can
   configure minimum width and height of embedded images to be shown. You can
   also restrict by name like with image links(by default all names are
   matched). The relevant settings are
   `extensions.imageforward.minHeight`,
   `extensions.imageforward.minWidth` and
   `extensions.imageforward.imageURLRegExp`.
 - For fullscreen, simply press F11 to enable Firefox' native fullscreen
   functionality
 - You can use the Firefox back/forward functionality to go one image back at
   a time and then again forward until you reached the last image loaded with
   the above keyboard shortcuts. If there are many images on on a page, you
   might have to adjust `browser.sessionhistory.max_entries` to make this
   work as it effectively restricts the times you can go back in history.

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

