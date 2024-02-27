[![pre-commit Status](https://github.com/sblask/webextension-image-forward/actions/workflows/pre-commit.yml/badge.svg)](https://github.com/sblask/webextension-image-forward/actions/workflows/pre-commit.yml)

Image Forward
=============

A webextension to easily go through images embedded on or linked from a web page.

Note for Chrome
---------------

Keyboard shortcuts are not automatically set up. You need to do that manually
on the extension page in settings. These are the default ones:

 - Abort cycling through images and go back to page of origin: Ctrl+Shift+B
 - Show first/next image embedded in page: Ctrl+Shift+Space
 - Show first/next image linked from page: Ctrl+Space

Example
-------

```
+---------------------+
|  page_one           |
|                     |
|  +---------------+  |
|  |  image_one    |  |
|  +---------------+  |
|  +---------------+  |
|  |  image_two    |  |
|  +---------------+  |
|  +---------------+  |
|  |  image_three  |  |
|  +---------------+  |
+---------------------+
```

If you are on `page_one`  that contains 3 images, you can press
`Ctrl-Shift-Space` to load `image_one` as if you had right clicked it and
chosen `View Image`. Press again and `image_two` is loaded (without having to
go back to `page_one` and click on it), again and `image_three` is loaded. One
more press will bring you back two `page_one`. At any time you could have
pressed `Ctrl-Shift-B` to go straight back to `page_one`. Images are only
loaded if they are bigger than what's configured in the add-on's options,
otherwise they are skipped. A real example where you can do this is [The Big
Picture](http://www.boston.com/bigpicture/).

```
+-----------------------------+
|  page_two                   |
|                             |
|  <link to image.jpg>        |
|  <link to image.png>        |
|  <link to image.tiff>       |
|  <link to page_with_image>  |
|                             |
|                             |
|                             |
|                             |
|                             |
+-----------------------------+
```

Similarly, if you are on `page_two` that links to a bunch of images, you can
press `Ctrl-Space` to load first `image.jpg`, then `image.png` and then go back
to `page_two`. The images that are loadable are determined by a regular
expression that you can configure in the options. Add `tiff` to also load any
tiff image or match any page that you want to load. An example where this works
is [reddit's wallpaper topic](https://www.reddit.com/r/wallpaper) which however
contains many links to pages instead of images, so you have to check out the
options.

Due to conflicts, you can use `Alt-Shift-Space` and `Alt-Space` instead of the
default shortcuts to load images on Mac and `Ctrl-Shift-X` to go back in
Windows.

Inspired by parts of Opera 12's Fast Forward.

Privacy Policy
--------------

This extension does not collect or send data of any kind to third parties.

Feedback
--------

You can report bugs or make feature requests on
[Github](https://github.com/sblask/webextension-image-forward)

Patches are welcome.
