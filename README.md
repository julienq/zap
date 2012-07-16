Zap
===

Zap is Javascript library (with additional CSS and HTML resources) for SVG with
a focus on games. It is a standalone library comprising utility functions (text
formatting, element creation, custom events, localization, parametrization, &c.)
and basic objects.


Overview
--------

Include the [zap.js](zap/blob/master/zap.js) file (preferably at the end of your
HTML document), as well as the [zap.css](zap/blob/master/zap.css) stylesheet if
necessary (this provides some definitions to help with the layout of your page.)
You can use the [zap.html](zap/blob/master/zap.html) template as a starting
point.

### The Cosmos and its layers

The Cosmos is the universe in which a Zap game takes place. You can instantiate
a new cosmos with

    var cosmos = zap.make_cosmos();

The cosmos maintains a list of _layers_ that it updates when running. A layer
can be any SVG element. A new layer is added with:

    // layer is an SVG element
    cosmos.add_layer(layer);

Layers contain _sprites_ (see below); when a layer is added to the cosmos, a new
property **.sprites** is added, which is an array of the top-level sprites for
this layer.

To run or stop animations in the cosmos, set the **.running** property to true
or false.

### Sprites and particles

A _sprite_ is any SVG element associated with position and velocity information.

Particles are really sprites with an additional property **ttl** (_time to
live_) defining how many seconds it will be shown before being automatically
removed.



TODO List
---------

* Documentation
* Generator script (HTML skeleton with SVG, css/js stubs)
* Dev mode with parameters modification
* Set viewbox for content to fit available space
* Help with keyboard handling
* Camera control (zoom, rotate and pan)
* Animation frames for sprites and sprite editor
* Samples: snake, memory, isometric game, freeeeze, &c.
