(function (zap) {
  "use strict";

  var A = Array.prototype;

  // Some predefined global parameters
  window.$ZAP_AUDIO_CHANNELS = 32;
  window.$ZAP_REQUEST_ANIMATION_FRAME_MS = 15;


  // Simple format function for messages and templates. Use {0}, {1}...
  // as slots for parameters.
  String.prototype.fmt = function () {
    var args = [].slice.call(arguments);
    return this.replace(/\{(\d+)\}/g, function (s, p) {
      return args[p] === undefined ? "" : args[p];
    });
  };

  // Bind the function f to the object x. Additional arguments can be provided
  // to specialize the bound function.
  if (typeof Function.prototype.bind !== "function") {
    Function.prototype.bind = function (x) {
      var f = this;
      var args = A.slice.call(arguments, 1);
      return function () {
        return f.apply(x, args.concat(A.slice.call(arguments)));
      }
    };
  }

  // Useful XML namespaces for element creation below
  zap.SVG_NS = "http://www.w3.org/2000/svg";
  zap.XHTML_NS = "http://www.w3.org/1999/xhtml";
  zap.XLINK_NS = "http://www.w3.org/1999/xlink";
  zap.HTML_NS = zap.XHTML_NS;

  // Simple way to create elements, giving ns id and class directly within the
  // name of the element (e.g. svg:rect#background.test) Beware of calling this
  // function with `this` set to the target document. See the $ functions below
  // for more convenient element creation functions.
  zap.create_element = function (name, maybe_attrs) {
    var argc = 1;
    var attrs = {};
    if (typeof maybe_attrs === "object" &&
        !(maybe_attrs instanceof window.Node)) {
      attrs = maybe_attrs;
      argc = 2;
    }
    var classes = name.split(".");
    var tagname = classes.shift();
    if (classes.length > 0) {
      attrs["class"] =
        (attrs.hasOwnProperty("class") ? attrs["class"] + " " : "")
        + classes.join(" ");
    }
    var m = tagname.match(/^(?:(\w+):)?([\w.\-]+)(?:#([\w:.\-]+))?$/);
    if (m) {
      var ns = (m[1] && zap[m[1].toUpperCase() + "_NS"]) ||
        this.documentElement.namespaceURI;
      var elem = ns ? this.createElementNS(ns, m[2]) : this.createElement(m[2]);
      if (m[3]) {
        attrs.id = m[3];
      }
      for (var a in attrs) {
        if (attrs.hasOwnProperty(a) &&
            attrs[a] !== undefined && attrs[a] !== null) {
          var split = a.split(":");
          ns = split[1] && zap[split[0].toUpperCase() + "_NS"];
          if (ns) {
            elem.setAttributeNS(ns, split[1], attrs[a]);
          } else {
            elem.setAttribute(a, attrs[a]);
          }
        }
      }
      A.forEach.call(arguments, function (ch, i) {
        if (i >= argc) {
          if (typeof ch === "string") {
            elem.appendChild(this.createTextNode(ch));
          } else if (ch instanceof window.Node) {
            elem.appendChild(ch);
          }
        }
      }, this);
      return elem;
    }
  };

  // Shortcut to create elements, e.g. $("svg#main.zap-content")
  window.$ = function () {
    return zap.create_element.apply(window.document, arguments);
  };

  // Shortcut for HTML and SVG elements: the element name prefixed by a $ sign
  // Cf. http://dev.w3.org/html5/spec/section-index.html#elements-1
  ["a", "abbr", "address", "area", "article", "aside", "audio", "b", "base",
    "bdi", "bdo", "blockquote", "body", "br", "button", "canvas", "caption",
    "cite", "code", "col", "colgroup", "command", "datalist", "dd", "del",
    "details", "dfn", "dialog", "div", "dl", "dt", "em", "embed", "fieldset",
    "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5",
    "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "img",
    "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "map",
    "mark", "menu", "meta", "meter", "nav", "noscript", "object", "ol",
    "optgroup", "option", "output", "p", "param", "pre", "progress", "q",
    "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small",
    "source", "span", "strong", "style", "sub", "summary", "sup", "table",
    "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr",
    "tref", "track", "u", "ul", "var", "video", "wbr"].forEach(function (tag) {
    window["$" + tag] = zap.create_element.bind(window.document, tag);
  });

  // SVG elements (a, color-profile, font-face, font-face-format,
  // font-face-name, font-face-src, font-face-uri, missing-glyph, script, style,
  // and title are omitted because of clashes with the HTML namespace or lexical
  // issues with Javascript; elements that have an xlink:href attribute such as
  // use are defined below.)
  // Cf. http://www.w3.org/TR/SVG/eltindex.html
  ["altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor",
    "animateMotion", "animateTransform", "circle", "clipPath", "cursor", "defs",
    "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer",
    "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap",
    "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR",
    "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology",
    "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile",
    "feTurbulence", "filter", "font", "foreignObject", "g", "glyph", "glyphRef",
    "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata",
    "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect",
    "set", "stop", "svg", "switch", "symbol", "text", "textPath",
    "tref", "tspan", "view", "vkern"].forEach(function (tag) {
    window["$" + tag] = zap.create_element.bind(window.document, "svg:" + tag);
  });

  // $use takes an initial xlink:href attribute to simplify its creation
  // TODO other elements that use xlink:href?
  window.$use = function (href) {
    var use = zap.create_element.apply(window.document,
        ["svg:use"].concat(A.slice.call(arguments, 1)));
    use.setAttributeNS(zap.XLINK_NS, "href", href);
    return use;
  };


  // Return the value constrained between min and max; NaN is converted to 0
  zap.clamp = function (value, min, max) {
    return Math.max(Math.min(isNaN(value) ? 0 : value, max), min);
  };

  // Compute the square of the distance between p1 and p2
  zap.dist = function(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  // Degree to radian conversion
  zap.deg2rad = function (a) {
    return a / 180 * Math.PI;
  };

  // Friendlier description of a key press for a key event, returning an
  // all-lowercase string of the form "alt+shift+m", "up", "ctrl+space", etc.
  // Some key values might be numeric if they are not standard
  zap.describe_key = function (e) {
    var key = [];
    ["alt", "ctrl", "meta", "shift"].forEach(function (k) {
      if (e[k + "Key"]) {
        key.push(k);
      }
    });
    if (e.keyCode === 8) {
      key.push("del");
    } else if (e.keyCode === 9) {
      key.push("tab");
    } else if (e.keyCode === 13) {
      key.push("enter");
    } else if (e.keyCode === 16) {
      if (!e.shiftKey) {
        key.push("shift");
      }
    } else if (e.keyCode === 17) {
      if (!e.ctrlKey) {
        key.push("ctrl");
      }
    } else if (e.keyCode === 18) {
      if (!e.altKey) {
        key.push("alt");
      }
    } else if (e.keyCode === 27) {
      key.push("esc");
    } else if (e.keyCode === 32) {
      key.push("space");
    } else if (e.keyCode === 37) {
      key.push("left");
    } else if (e.keyCode === 38) {
      key.push("up");
    } else if (e.keyCode === 39) {
      key.push("right");
    } else if (e.keyCode === 40) {
      key.push("down");
    } else if (e.keyCode === 46) {
      key.push("backspace");
    } else if (e.keyCode >= 48 && e.keyCode <= 57) {
      key.push(e.keyCode - 48);
    } else if (e.keyCode >= 65 && e.keyCode <= 90) {
      key.push(String.fromCharCode(e.keyCode + 32));
    } else if (e.keyCode === 91 || e.keyCode === 93 || e.keyCode === 224) {
      if (!e.metaKey) {
        key.push("meta");
      }
    } else if (e.keyCode >= 112 && e.keyCode <= 123) {
      key.push("f" + (e.keyCode - 111));
    } else {
      key.push("?" + e.keyCode);
    }
    return key.join("+");
  };

  zap.find_prototype = function (p) {
    if (typeof p !== "string") {
      return;
    }
    var proto = window;
    var path = p.split(".");
    for (var i = 0, n = path.length; i < n; ++i) {
      proto = proto[path[i]];
      if (!(proto instanceof  Object)) {
        return;
      }
    }
    return proto;
  };

  // Fix for elements that do not have a dataset property (e.g. SVG elements do
  // not have a dataset in Firefox)
  zap.fix_dataset = function (elem) {
    if (!elem.dataset) {
      elem.dataset = {};
      A.forEach.call(elem.attributes, function (attr) {
        if (attr.name.substr(0, 5) === "data-") {
          elem.dataset[attr.name.substr(5)] = attr.value;
        }
      });
    }
  };

  // Another format function for messages and templates; this time, the only
  // argument is an object and string parameters are keys.
  zap.format = function (string, args) {
    return string.replace(/\{([^}]*)\}/g, function (s, p) {
      return args.hasOwnProperty(p) ? args[p] : "";
    });
  };

  // Test if a key press is special (alt, ctrl or meta)
  // We may want to leave these alone to not interfere with the browser
  // shortcuts
  zap.is_key_special = function (e) {
    return e.altKey || e.ctrlKey || e.metaKey;
  };

  // Test if the string p is "true" (tolerating extra whitespace and any case)
  zap.is_true = function (p) {
    return typeof p === "string" && p.trim().toLowerCase() === "true";
  };

  // Make a new object from a proto and call its init method with the rest of
  // the arguments
  zap.make = function (proto) {
    var obj = Object.create(proto);
    return proto.init.apply(obj, A.slice.call(arguments, 1));
  };

  // Pad a string to the given length with the given padding (defaults to 0)
  zap.pad = function(string, length, padding) {
    if (typeof padding !== "string") {
      padding = "0";
    }
    if (typeof string !== "string") {
      string = string.toString();
    }
    var l = length + 1 - string.length;
    return l > 0 ? (Array(l).join(padding)) + string : string;
  };

  // Init audio (this is adapted from Perlenspiel)
  // TODO use WebAudio when possible
  zap.play_sound = (function () {
    var channels = [];
    for (var i = 0; i < $ZAP_AUDIO_CHANNELS; ++i) {
      channels[i] = new Audio();
      channels[i]._done = -1;
    }
    return function (id, volume) {
      var sound = document.getElementById(id);
      if (!sound) {
        console.warn("No sound for id \"{0}\"".fmt(id));
        return;
      }
      if (volume >= 0 && volume <= 1) {
        sound.volume = volume;
      }
      for (var i = 0; i < $ZAP_AUDIO_CHANNELS; ++i) {
        var t = Date.now();
        var channel = channels[i];
        if (channel._done < t) {
          channel._done = t + (sound.duration * 1000);
          channel.audio = sound;
          sound.load();
          sound.play();
          return;
        }
      }
    }
  }());

  // Get an SVG point from a mouse/touch event
  zap.point_from_event = function (e, svg) {
    var p;
    if (!svg) {
      svg = document.querySelector("svg");
    }
    p = svg.createSVGPoint();
    p.x = e.touches ? e.touches[0].clientX : e.clientX;
    p.y = e.touches ? e.touches[0].clientY : e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  // Radian to degree conversion
  zap.rad2deg = function (th) {
    return th / Math.PI * 180;
  };

  // Return a random element from an array
  zap.random_element = function (a) {
    return a[zap.random_int(a.length - 1)];
  };

  // Return a random integer in the [min, max] range; the range may be a
  // two-element array
  zap.random_int = function (min, max) {
    if (max === undefined) {
      if (min instanceof Array) {
        max = min[1];
        min = min[0];
      } else {
        max = min;
        min = 0;
      }
    }
    return min + Math.floor(Math.random() * (max + 1 - min));
  };


  // TODO review these

  // Return a random integer between -n/2 and n/2
  zap.random_int_around = function (n) {
    return Math.round((n / 2) - Math.random() * (n + 1));
  };

  // Return a random integer between n-amp/2 and n+amp/2
  zap.random_int_amp = function (n, amp) {
    return zap.random_int(Math.floor(n - amp / 2), Math.floor(n + amp / 2));
  };

  // Generate a random integer in the [-max, -min] U [min, max] range
  zap.random_int_signed = function (min, max) {
    return zap.random_int(min, max) * (Math.random() < 0.5 ? -1 : 1);
  };

  // Return a random number in the [min, max[ range
  zap.random_number = function(min, max) {
    if (max === undefined) {
      if (min instanceof Array) {
        max = min[1];
        min = min[0];
      } else {
        max = min;
        min = 0;
      }
    }
    return min + Math.random() * (max - min);
  };

  // Remap a value from a given range to another range (from Processing)
  zap.remap = function (value, istart, istop, ostart, ostop) {
    return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
  };

  // Remove all children of an element
  zap.remove_children = function (elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  };

  // Remove an item from an array
  zap.remove_from_array = function (array, item) {
    if (array) {
      var index = array.indexOf(item);
      if (index >= 0) {
        return array.splice(index, 1)[0];
      }
    }
  };

  // Replacement for requestAnimationFrame using simply a timer. Set the global
  // parameter $ZAP_REQUEST_ANIMATION_FRAME_MS to change the delay time
  // (set to 15ms by default to approximate 60 fps)
  zap.request_animation_frame = function (f) {
    window.setTimeout(function () {
      f(Date.now());
    }, $ZAP_REQUEST_ANIMATION_FRAME_MS);
  };

  // Toggle between the browser's own requestAnimationFrame and our setTimeout
  // approximation. This is useful to test browser performance
  zap.toggle_request_animation_frame = (function () {
    var r =  window.requestAnimationFrame || window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame || window.oRequestAnimationFrame ||
      window.webkitRequestAnimationFrame || zap.request_animation_frame;
    window.requestAnimationFrame = r;
    return function () {
      window.requestAnimationFrame =
        window.requestAnimationFrame === r ? zap.request_animation_frame : r;
    }
  }());


  // Color functions

  // Yes, these are the colors from d3.js in case anybody asks
  // https://github.com/mbostock/d3/wiki/Ordinal-Scales#wiki-category10
  // TODO come up with own palette
  zap.color_10 = function(n) {
    var colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
      "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
    if (!n) {
      n = zap.random_int(0, colors.length);
    }
    return colors[Math.abs(n % colors.length)];
  };

  // Get one out of 20 colors, chosen randomly if no argument is given
  zap.color_20 = function(n) {
    var colors = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c",
      "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b",
      "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22",
      "#dbdb8d", "#17becf", "#9edae5"];
    if (!n) {
      n = zap.random_int(0, colors.length);
    }
    return colors[Math.abs(n % colors.length)];
  };

  // Convert a color from hsv space (hue in radians, saturation and brightness
  // in the [0, 1] range) to RGB, returned as an array in the [0, 256[ range.
  zap.hsv_to_rgb = function(h, s, v) {
    s = zap.clamp(s, 0, 1);
    v = zap.clamp(v, 0, 1);
    if (s === 0) {
      var v_ = Math.round(v * 255);
      return [v_, v_, v_];
    } else {
      h = (((h * 180 / Math.PI) + 360) % 360) / 60;
      var i = Math.floor(h);
      var f = h - i;
      var p = v * (1 - s);
      var q = v * (1 - (s * f));
      var t = v * (1 - (s * (1 - f)));
      return [Math.round([v, q, p, p, t, v][i] * 255),
        Math.round([t, v, v, q, p, p][i] * 255),
        Math.round([p, p, t, v, v, q][i] * 255)];
    }
  };

  // Convert a color from hsv space (hue in radians, saturation and brightness
  // in the [0, 1] range) to an RGB hex value
  zap.hsv_to_hex = function(h, s, v) {
    return zap.rgb_to_hex.apply(this, zap.hsv_to_rgb(h, s, v));
  };

  // Convert an RGB color (3 values in the 0..255 range) to a hex value
  zap.rgb_to_hex = function(r, g, b) {
    return "#" + A.map.call(arguments, function (x) {
        return zap.pad(x.toString(16), 2, "0");
      }).join("");
  };

  // Convert an sRGB color (3 values in the 0..1 range) to a hex value
  zap.srgb_to_hex = function(r, g, b) {
    return "#" + [].map.call(arguments, function (x) {
        return zap.pad(Math.floor(x * 255).toString(16), 2, "0");
      }).join("");
  };


  // Shapes

  // Create a regular polygon with the number of sides inscribed in a circle of
  // the given radius, with an optional starting phase (use Math.PI / 2 to have
  // it pointing up at all times)
  zap.polygon = function (sides, radius, phase) {
    return $("svg:polygon",
        { points: zap.polygon_points(sides, radius, phase) });
  };

  zap.polygon_points = function (sides, radius, phase) {
    var points = [];
    if (phase === undefined) {
      phase = 0;
    }
    for (var i = 0; i < sides; ++i) {
      points.push(radius * Math.cos(phase));
      points.push(-radius * Math.sin(phase));
      phase += 2 * Math.PI / sides;
    }
    return points.join(" ");
  };

  // Same as above but create a star with the given inner radius
  zap.star = function (sides, ro, ri, phase) {
    return $("svg:polygon",
        { points: zap.svg_star_points(sides, ro, ri, phase) });
  };

  zap.star_points = function (sides, ro, ri, phase) {
    var points = [];
    if (phase === undefined) {
      phase = 0;
    }
    sides *= 2;
    for (var i = 0; i < sides; ++i) {
      var r = i % 2 === 0 ? ro : ri;
      points.push(r * Math.cos(phase));
      points.push(-r * Math.sin(phase));
      phase += 2 * Math.PI / sides;
    }
    return points.join(" ");
  };


  function init_number_property(obj, prop, n) {
    if (typeof obj[prop] !== "number") {
      obj[prop] = n;
    }
  }

  function update(dt) {
    this.will_update(dt);
    this.children.forEach(function (ch) {
      ch.update(dt);
      if (typeof ch.ttl === "number") {
        ch.ttl -= dt;
        if (ch.ttl <= 0) {
          this.remove_child(ch);
        }
      }
    }, this);
    this.did_update(dt);
    this.set_transform();
  }

  zap.system = {

    append_child: append_child,

    init: function (elem) {
      var enabled = true;
      Object.defineProperty(this, "enabled", { enumerable: true,
        get: function () { return enabled; },
        set: function (p) {
          p = !!p;
          if (p !== enabled) {
            enabled = p;
            if (elem.classList) {
              if (enabled) {
                elem.classList.remove("zap--hidden");
              } else {
                elem.classList.add("zap--hidden");
              }
            } else {
              if (enabled) {
                elem.removeAttribute("display");
              } else {
                elem.setAttribute("display", "none");
              }
            }
          }
        } });
      this.elem = elem;
      this.children = [];
      init_number_property(this, "x", 0);
      init_number_property(this, "y", 0);
      init_number_property(this, "r", 0);
      init_number_property(this, "s", 1);
      for (var a in elem.dataset) {
        if (elem.dataset.hasOwnProperty(a) && a !== "proto") {
          var v = parseFloat(elem.dataset[a]);
          if (isNaN(v)) {
            this[a] = elem.dataset[a];
          } else {
            this[a] = v;
          }
        }
      }
      return this;
    },

    new_child: function () {
      return this.append_child(zap.make.apply(zap, arguments));
    },

    remove_child: remove_child,

    remove_children: function () {
      while (this.children.length > 0) {
        this.remove_child(this.children[0]);
      }
    },

    remove_self: function () {
      if (this.parent) {
        this.parent.remove_child(this);
      }
    },

    set_transform: function () {
      if (this.elem) {
        this.elem.setAttribute("transform",
          zap.format("translate({x}, {y}) rotate({r}) scale({s})", this));
      }
    },

    update: function (dt) {
      if (this.enabled) {
        update.call(this, dt);
      }
    },

    did_update: function () {},
    will_update: function () {}

  };

  zap.sprite = Object.create(zap.system);

  zap.sprite.init = function (elem) {
    var h;
    Object.defineProperty(this, "cosmos", { enumerable: true,
      get: function () {
        return this.parent && this.parent.cosmos;
      } });
    Object.defineProperty(this, "h", { enumerable: true,
      get: function () { return h; },
      set: function (h_) {
        h = (h_ + 360) % 360;
        this.th = zap.deg2rad(h);
      } });
    init_number_property(this, "h", 0);
    init_number_property(this, "a", 0);
    init_number_property(this, "v", 0);
    init_number_property(this, "vmin", -Infinity);
    init_number_property(this, "vmax", Infinity);
    init_number_property(this, "vh", 0);
    init_number_property(this, "vr", 0);
    return zap.system.init.call(this, elem);
  };

  // Collide this sprite against a list of other sprites assuming a circular
  // hit area defined by the r_collide property of each sprite. Return the
  // first sprite that collides or undefined when there is no collision
  zap.sprite.collide_radius = function (sprites) {
    for (var i = 0, n = sprites.length; i < n; ++i) {
      var dx = this.x - sprites[i].x;
      var dy = this.y - sprites[i].y;
      var d = this.r_collide * this.s + sprites[i].r_collide;
      if ((dx * dx + dy * dy) < (d * d)) {
        return sprites[i];
      }
    }
  };

  zap.sprite.update = function (dt) {
    this.v = zap.clamp(this.v + this.a * dt, this.vmin, this.vmax);
    this.h += this.vh * dt;
    this.r += this.vr * dt;
    this.x += this.v * Math.cos(this.th) * dt;
    this.y += this.v * Math.sin(this.th) * dt;
    zap.system.update.call(this, dt);
  };

  function append_child(ch) {
    ch.parent = this;
    this.children.push(ch);
    if (!ch.elem.parentNode) {
      this.elem.appendChild(ch.elem);
    }
    if (ch.elem.id) {
      this.children[ch.elem.id] = ch;
      this["$" + ch.elem.id] = ch;
    }
    return ch;
  }

  function remove_child(ch) {
    var index = this.children.indexOf(ch);
    if (index >= 0) {
      this.children.splice(index, 1);
    }
    if (ch.elem.id) {
      delete parent.children[ch.elem.id];
      delete parent["$" + ch.elem.id];
    }
    ch.parent = null;
    if (ch.elem.parentNode) {
      ch.elem.parentNode.removeChild(ch.elem);
    }
  }

  // This is the main object for a game
  zap.cosmos = {

    append_child: append_child,

    init: function (elem) {
      if (!(elem instanceof window.Node)) {
        elem = document.querySelector("svg") || document.body;
      }
      this.elem = elem;
      this.children = [];

      var init_children = function (elem, parent) {
        A.forEach.call(elem.childNodes, function (ch) {
          if (ch.nodeType === window.Node.ELEMENT_NODE) {
            var proto = ch.getAttribute("data-proto");
            if (proto) {
              zap.fix_dataset(ch);
              proto = zap.find_prototype(ch.dataset.proto);
              if (proto) {
                var p = parent.append_child(Object.create(proto).init(ch));
              }
            }
            init_children(ch, p || parent);
            p = parent;
          }
        }, this);
      };
      init_children(elem, this);

      var running;
      Object.defineProperty(this, "running", { enumerable: true,
        get: function () {
          return running;
        }, set: function (p) {
          running = !!p;
          this.t_last = Date.now();
          if (running) {
            window.requestAnimationFrame(this.update.bind(this));
          }
        } });
      zap.fix_dataset(elem);
      this.running = zap.is_true(elem.dataset.running);
      return this;
    },

    remove_child: remove_child,

    set_transform: function () {},

    update: function (t) {
      if (this.running) {
        var dt = (t - this.t_last) / 1000;
        this.t_last = t;
        if (dt > 0) {
          update.call(this, dt);
        }
        window.requestAnimationFrame(this.update.bind(this));
      }
    },

    did_update: function () {},
    will_update: function () {}
  };


  // Initialize parameters
  // Use data-param to introduce the name of a parameter, which will then be
  // available as $name. The value for the parameter may be one of:
  //   * data-num (floating point number)
  //   * data-range (two numbers separated by white space)
  //   * data-tokens (a list of strings separated by white space)
  //   * if none of the above, the text content of the node (TODO: elements)
  A.forEach.call(document.querySelectorAll("[data-param]"), function (p) {
    if (p.dataset.hasOwnProperty("num")) {
      window["$" + p.dataset.param] = parseFloat(p.dataset.num);
    } else if (p.dataset.hasOwnProperty("range")) {
      window["$" + p.dataset.param] = p.dataset.range.trim().split(" ")
        .map(function (n) {
          return parseFloat(n);
        });
    } else if (p.dataset.hasOwnProperty("tokens")) {
      window["$" + p.dataset.param] = p.dataset.tokens.trim().split(" ");
    } else {
      window["$" + p.dataset.param] = p.textContent;
    }
  });

}(window.zap = {}));
