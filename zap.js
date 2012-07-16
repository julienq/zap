(function (zap) {
  "use strict";

  var A = Array.prototype;

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame || window.oRequestAnimationFrame ||
      window.webkitRequestAnimationFrame || function (f) {
      window.setTimeout(function () {
        f(Date.now());
      }, 15);
    };
  }

  // Simple format function for messages and templates. Use {0}, {1}...
  // as slots for parameters. Missing parameters are note replaced.
  String.prototype.fmt = function () {
    var args = [].slice.call(arguments);
    return this.replace(/\{(\d+)\}/g, function (s, p) {
      return args[p] === undefined ? "" : args[p];
    });
  };

  // Another format function for messages and templates; this time, the only
  // argument is an object and string parameters are keys.
  String.prototype.format = function (args) {
    return this.replace(/\{([^}]*)\}/g, function (s, p) {
      return args.hasOwnProperty(p) ? args[p] : "";
    });
  };

  // Useful XML namespaces
  zap.SVG_NS = "http://www.w3.org/2000/svg";
  zap.XHTML_NS = "http://www.w3.org/1999/xhtml";
  zap.XLINK_NS = "http://www.w3.org/1999/xlink";
  zap.XML_NS = "http://www.w3.org/1999/xml";
  zap.XMLNS_NS = "http://www.w3.org/2000/xmlns/";
  zap.HTML_NS = zap.XHTML_NS;

  // Return the value constrained between min and max; NaN is converted to 0
  zap.clamp = function (value, min, max) {
    return Math.max(Math.min(isNaN(value) ? 0 : value, max), min);
  };

  // Simple way to create elements, giving ns id and class directly within the
  // name of the element (e.g. svg:rect#background.test) Beware of calling this
  // function with `this` set to the target document.
  zap.create_element = function (name, maybe_attrs) {
    var argc = 1;
    var attrs = {};
    if (typeof maybe_attrs === "object" && !(maybe_attrs instanceof window.Node)) {
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
          ns = split[1] && zap[split[0].toUppserCase() + "_NS"];
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
          } else if (ch instanceof Node) {
            elem.appendChild(ch);
          }
        }
      }, this);
      return elem;
    }
  };

  // Shortcut to create elements
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

  // SVG elements (ommitted: a, color-profile, font-face, font-face-format,
  // font-face-name, font-face-src, font-face-uri, missing-glyph, script, style,
  // title)
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
  // TODO other elements that use xlink:href
  window.$use = function (href) {
    var use = zap.create_element.apply(window.document,
        ["svg:use"].concat(A.slice.call(arguments, 1)));
    use.setAttributeNS(zap.XLINK_NS, "href", href);
    return use;
  };

  zap.deg2rad = function (a) {
    return a / 180 * Math.PI;
  };

  // Get clientX/clientY as an object { x: ..., y: ... } for events that may
  // be either a mouse event or a touch event, in which case the position of
  // the first touch is returned.
  zap.event_client_pos = function (e) {
    return { x: e.targetTouches ? e.targetTouches[0].clientX : e.clientX,
      y: e.targetTouches ? e.targetTouches[0].clientY : e.clientY };
  };

  // Make an XMLHttpRequest with optional params and a callback when done
  zap.ez_xhr = function (uri, params, f) {
    var req = new XMLHttpRequest();
    if (f === undefined) {
      f = params;
      params = {};
    }
    req.open(params.method || "GET", uri);
    if (params.hasOwnProperty("responseType")) {
      req.responseType = params.responseType;
    }
    req.onload = function () {
      f(req);
    };
    req.send(params.data || "");
  };

  // Return true iff the element only contains text (or has no content at all,
  // which is the same as the empty string)
  zap.is_text_only = function (elem) {
    return !A.some.call(elem.childNodes, function (ch) {
      return ch.nodeType !== window.Node.TEXT_NODE &&
        ch.nodeType !== window.Node.CDATA_SECTION;
    });
  };

  zap.rad2deg = function (th) {
    return th / Math.PI * 180;
  };

  // Return a random element from an array
  zap.random_element = function (a) {
    return a[zap.random_int(a.length - 1)];
  };

  // Return a random integer in the [min, max] range
  zap.random_int = function (min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max + 1 - min));
  };

  // Return a random integer between -n/2 and n/2
  zap.random_int_around = function (n) {
    return Math.round((n / 2) - Math.random() * (n + 1));
  };

  // Generate a random integer in the [-max, -min] U [min, max] range
  zap.random_int_signed = function (min, max) {
    return zap.random_int(min, max) * (Math.random() < 0.5 ? -1 : 1);
  }

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


  // Custom events

  // Listen to a custom event. Listener is a function or an object whose
  // "handleEvent" function will then be invoked.
  zap.listen = function (target, type, listener) {
    if (!(target.hasOwnProperty(type))) {
      target[type] = [];
    }
    target[type].push(listener);
  };

  // Listen to an event only once
  zap.listen_once = function (target, type, listener) {
    var h = function (e) {
      zap.unlisten(target, type, h);
      if (typeof listener.handleEvent === "function") {
        listener.handleEvent.call(listener, e);
      } else {
        listener(e);
      }
    };
    zap.listen(target, type, h);
  };

  // Can be called as notify(e), notify(source, type) or notify(source, type, e)
  zap.notify = function (source, type, e) {
    if (e) {
      e.source = source;
      e.type = type;
    } else if (type) {
      e = { source: source, type: type };
    } else {
      e = source;
    }
    if (e.source.hasOwnProperty(e.type)) {
      e.source[e.type].slice().forEach(function (listener) {
        if (typeof listener.handleEvent === "function") {
          listener.handleEvent.call(listener, e);
        } else {
          listener(e);
        }
      });
    }
  };

  // Stop listening
  zap.unlisten = function (target, type, listener) {
    zap.remove_from_array(target[type], listener);
  };


  // A layer is any SVG element that contains sprite.
  zap.update_layer = function (layer, dt) {
    if (layer.sprites && dt > 0) {
      layer.sprites.forEach(function (sprite) {
        sprite.update(dt);
      });
    }
  };

  // Sprites
  zap.sprite = {

    angle: function (a) {
      this.a = (a + 360) % 360;
      this.set_position();
      this.elem.setAttribute("transform", "translate({x}, {y}) rotate({a})"
        .format(this));
    },

    position: function (x, y, a) {
      this.x = x;
      this.y = y;
      if (typeof a === "number") {
        this.angle(a);
      } else {
        this.set_position();
        this.elem.setAttribute("transform", "translate({x}, {y}) rotate({a})"
          .format(this));
      }
    },

    remove: function () {
      if (this.parent) {
        this.parent.sprites.splice(this.parent.sprites.indexOf(this), 1);
      }
      this.elem.parentNode.removeChild(this.elem);
      delete this.parent;
      delete this.cosmos;
    },

    set_position: function () {},

    update: function (dt) {
      this.angular_velocity += this.angular_acceleration;
      this.velocity += this.acceleration;
      this.position(this.x + this.vx * dt, this.y + this.vy * dt,
        this.a + this.va * dt);
      if (this.hasOwnProperty("ttl")) {
        this.ttl -= dt;
        if (this.ttl < 0) {
          this.remove();
        }
      }
      zap.update_layer(this, dt);
    },
  };

  // Initialize a sprite with its element, parent (another sprite or a layer)
  zap.make_sprite = function (elem, parent, proto) {
    var sprite = Object.create(proto || sprite_prototype);
    sprite.elem = elem;
    sprite.sprites = [];
    sprite.x = 0;
    sprite.y = 0;
    sprite.a = 0;
    sprite.vx = 0;
    sprite.vy = 0;
    sprite.va = 0;

    var angular_velocity;
    Object.defineProperty(sprite, "angular_velocity", { enumerable: true,
      get: function () {
        return angular_velocity;
      }, set: function (v) {
        if (!isNaN(v)) {
          angular_velocity =
            zap.clamp(v, 0, this.max_angular_velocity || Infinity);
        }
      } });

    var velocity;
    Object.defineProperty(sprite, "velocity", { enumerable: true,
      get: function () {
        return velocity;
      }, set: function (v) {
        if (!isNaN(v)) {
          velocity = zap.clamp(v, 0, this.max_velocity || Infinity);
          var th = this.a / 180 * Math.PI;
          this.vx = velocity * Math.cos(th);
          this.vy = velocity * Math.sin(th);
        }
      } });

    if (!parent.sprites) {
      parent.sprites = [];
    }
    parent.sprites.push(sprite);
    sprite.parent = parent;
    sprite.cosmos = parent.cosmos;
    if (!sprite.elem.parentNode) {
      if (parent instanceof window.Node) {
        parent.appendChild(sprite.elem);
      } else {
        parent.elem.parentNode.appendChild(sprite.elem);
      }
    }
    return sprite;
  };

  // A particle is simply a sprite with its ttl property set
  zap.make_particle = function (elem, parent, ttl, proto) {
    var p = zap.make_sprite(elem, parent, proto);
    p.ttl = ttl;
    return p;
  };

  // This is the main object for a game
  zap.cosmos = {

    add_layer: function (layer) {
      this.layers.push(layer);
      layer.cosmos = this;
      return layer;
    },

    update: function (t) {
      if (this.running) {
        var dt = (t - this.t_last) / 1000;
        this.t_last = t;
        this.layers.forEach(function (layer) {
          zap.update_layer(layer, dt);
        });
        window.requestAnimationFrame(this.update.bind(this));
        this.updated(dt);
      }
    },

    updated: function () {}
  };

  zap.make_cosmos = function (proto) {
    var cosmos = Object.create(proto || zap.cosmos);
    cosmos.layers = [];
    var running = false;
    Object.defineProperty(cosmos, "running", { enumerable: true,
      get: function () {
        return running;
      }, set: function (p) {
        running = !!p;
        cosmos.t_last = Date.now();
        if (running) {
          window.requestAnimationFrame(this.update.bind(this));
        }
      } });
    return cosmos;
  };

  // L10N
  zap.l = {};
  A.forEach.call(document.querySelectorAll("[data-l10n]"), function (e) {
    zap.l[e.dataset.l10n] = zap.is_text_only(e) ? e.textContent : e;
  });

  // Parameters
  A.forEach.call(document.querySelectorAll("[data-param]"), function (p) {
    if (p.dataset.hasOwnProperty("num")) {
      window["$" + p.dataset.param] = parseFloat(p.dataset.num);
    } else {
      window["$" + p.dataset.param] = p.textContent;
    }
  });

  // Init audio (this is adapted from Perlenspiel)
  // If the ZAP_AUDIO_CHANNELS parameter is not set, we assume no audio
  zap.play_sound = (function () {
    var channels = [];
    for (var i = 0; i < $ZAP_AUDIO_CHANNELS; ++i) {
      channels[i] = new Audio();
      channels[i]._done = -1;
    }
    return function (id, volume) {
      var sound = document.getElementById(id);
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

}(window.zap = {}));
