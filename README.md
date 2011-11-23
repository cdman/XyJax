# XyJax

## XyJax = MathJax + Xy-pic

XyJax is a almost Xy-pic compatible language extension for MathJax.

This extension enable us to draw various graphs and diagrams.

See http://homepage.mac.com/oasis/xyjax.html for more details. And origins

- MathJax: http://www.mathjax.org/ (Mother)
- Xy-pic: http://www.tug.org/applications/Xy-pic/ (Father)

But, this software is under development, so this release is alpha-quality (often buggy).


## Installation and Usage

THIS INSTALL INSTRUCTION IS TENTATIVE.

I'm trying to separate XyJax package from the original MathJax's code.

1. Download XyJax's source code.
 + go to the download site (this page).
 + click the Downloads button on the upper right side, and click Download zip (or tar.gz) button.
2. Extract the downloaded zip (or tar.gz) file.
3. Open the extracted folder.
 + you can see the following files/directories (selected).
  + test: samples
  + fonts: font images
  + unpacked: XyJax's and MathJax's source code.
  + xyjax.html: published as http://homepage.mac.com/oasis/xyjax.html
4. Open test/sample-xyjax.html with Firefox/Safari/Chrome.
 + you can see so-called commutative diagram, if XyJax works.
5. Use XyJax on your own site.
 + like the configuration of the test/sample-xy.jax, load unpacked/MathJax.js and fp.js, xypic.js within pages on your site.

## Limitation

- Supported Browsers: Firefox, Safari, Chrome, Opera, Internet Explorer 9 (IE9 Standards Mode only)
- Unsupported Browsers: Internet Explorer 8 or lower, etc...

## Contact

If you have any questions about XyJax, please let me know.

- e-mail: Isao Sonobe <sonoisa@gmail.com>
