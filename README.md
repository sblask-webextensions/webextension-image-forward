firefox-image-forward
=====================

A firefox extension for easy cycling through images and image links on a page.
Inspired by parts of Opera 12's fast forward.

Similar extensions are:

 - [Browse Images](https://addons.mozilla.org/en-US/firefox/addon/browse-images/)
 - [Full Screen Image Viewer](https://addons.mozilla.org/en-US/firefox/addon/full-screen-image-viewer/)

This extension aims at providing the same functionality(apart from an
automatic slideshow) in a much simpler and reliable way by using as little
custom functionality as possible:

 - Image links are simply loaded as if they where clicked upon, embedded
   pictures as if you'd have used `View Image` from context menu. Thus,
   you can combine `Image Forward` with other extension to enhance their
   display.
 - You can use `about:config` to modify
   `extensions.imageforward.linkURLRegExp` to control which links count as
   images. To configure minimum width and height of embedded images to be
   shown, you can modify `extensions.imageforward.minHeight` and
   `extensions.imageforward.minWidth`.
 - For fullscreen, simply press F11 to enable Firefox' fullscreen display
 - There are only 3 custom keyboard shortcuts, `Ctrl Space` for cycling
   through image links, `Ctrl Shift Space` for cycling through embedded
   images and `Ctrl Shift Escape` to go back to the web page images. All three
   are configurable using the
   [Customizable Shortcuts extension](https://addons.mozilla.org/en-US/firefox/addon/customizable-shortcuts/)
 - The corresponding functionality is provided by
   gImageForward.iterateImages(),
   gImageForward.iterateImageLinks and
   gImageForward.abortIteration()
   which you can call for example using
   [FireGestures](https://addons.mozilla.org/en-US/firefox/addon/firegestures/)
 - You can use the Firefox back/forward functionality to go one image back at
   a time and then again forward until you reached the last image loaded with `Image
   Forward`'s keyboard shortcuts. No images are skipped if you combine both
   navigation methods.

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

