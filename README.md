[![Build Status](https://travis-ci.org/sblask/firefox-image-forward.svg?branch=master)](https://travis-ci.org/sblask/firefox-image-forward)

firefox-image-forward
=====================

A firefox extension to easily go through images embedded on or linked from a web page.

Example:

```
+---------------------+   +-----------------------------+
|   page_one          |   |  page_two                   |
|                     |   |                             |
|  +---------------+  |   |  <link to image.jpg>        |
|  |  image_one    |  |   |  <link to image.png>        |
|  +---------------+  |   |  <link to image.tiff>       |
|  +---------------+  |   |  <link to page_with_image>  |
|  |  image_two    |  |   |                             |
|  +---------------+  |   |                             |
|  +---------------+  |   |                             |
|  |  image_three  |  |   |                             |
|  +---------------+  |   |                             |
+---------------------+   +-----------------------------+
```

If you are on `page_one` and you can see 3 images, you can press
`Ctrl-Shift-Space` to load `image_one` as if you had right clicked it and
chosen `View Image`. Press again and `image_two` is loaded (without having to
go back to `page_one` and click on it), again and `image_three` is loaded. One
more press will bring you back two `page_one`. At any time you could have
pressed `Ctrl-Shift-B` to go straight back to `page_one`. Images are only
loaded if they are bigger than what's configured in the add-on's options,
otherwise they are skipped. A real example where you can do this is [The Big
Picture](http://www.boston.com/bigpicture/).

Similarly, if you are on `page_two` you can press `Ctrl-Space` to load first
`image.jpg`, then `image.png` and then go back to `page_two`. The images that
are loadable are determined by a regular expression that you can configure in
the options. Add `tiff` to also load any tiff image or match any page that you
want to load. An example where this works is [reddit's wallpaper
topic](https://www.reddit.com/r/wallpaper) which however contains many links to
pages instead of images, so you have to check out the options.

Inspired by parts of Opera 12's Fast Forward.

Feedback
--------

You can report bugs or make feature requests on
[Github](https://github.com/sblask/firefox-image-forward).

Patches are welcome.
