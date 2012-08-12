(function (ui) {
  "use strict";

  var A = Array.prototype;


  // Custom events

  // Listen to a custom event. Listener is a function or an object whose
  // "handleEvent" function will then be invoked.
  ui.listen = function (target, type, listener) {
    if (!(target.hasOwnProperty(type))) {
      target[type] = [];
    }
    target[type].push(listener);
  };

  // Listen to an event only once
  ui.listen_once = function (target, type, listener) {
    var h = function (e) {
      ui.unlisten(target, type, h);
      if (typeof listener.handleEvent === "function") {
        listener.handleEvent.call(listener, e);
      } else {
        listener(e);
      }
    };
    ui.listen(target, type, h);
  };

  // Can be called as notify(e), notify(source, type) or notify(source, type, e)
  ui.notify = function (source, type, e) {
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
  ui.unlisten = function (target, type, listener) {
    zap.remove_from_array(target[type], listener);
  };



  // Add or remove the class c on elem according to the value of predicate p
  // (add if true, remove if false)
  ui.set_class_iff = function (elem, c, p) {
    if (p) {
      elem.classList.add(c);
    } else {
      elem.classList.remove(c);
    }
  };


  // Add class for UI elements unless data-no-default is specified
  function add_class(elem, k) {
    if (!zap.is_true(elem.dataset.noDefault)) {
      elem.classList.add(k);
    }
  }


  // Base control object; call its initializer first
  ui.control = {
    base_init: function (elem, parent) {
      if (elem) {
        this.elem = elem;
        this.elem.ui = this;
      }
      if (parent) {
        this.parent = parent;
        this.parent.children.push(this);
      }
      this.children = [];
      return this;
    }
  };


  // A button that sends a @pushed event when pushed

  ui.button = Object.create(ui.control);

  ui.button.init = function () {
    add_class(this.elem, "ui-button");
    this.elem.setAttribute("aria-role", "button");
    this.elem.addEventListener("mousedown", this, false);
    this.elem.addEventListener("mouseup", this, false);
    var down = false;
    Object.defineProperty(this, "down", { enumerable: true,
      get: function () { return down; },
      set: function (p) {
        down = !!p;
        ui.set_class_iff(this.elem, "ui--down", p);
      } });
    return this;
  };

  ui.button.handleEvent = function (e) {
    if (e.type === "mousedown") {
      e.preventDefault();
      this.__down = true;
      this.elem.classList.add("ui--down");
    } else if (e.type === "mouseup" && this.__down) {
      delete this.__down;
      this.elem.classList.remove("ui--down");
      ui.notify(this, "@pushed");
    }
  };


  // Toolbar

  ui.toolbar = Object.create(ui.control);

  ui.toolbar.init = function () {
    var tool;
    Object.defineProperty(this, "tool", { enumerable: true,
      get: function () { return tool; },
      set: function (t) {
        if (tool !== t) {
          if (tool) {
            tool.control.down = false;
            if (tool.unselect) {
              tool.unselect();
            }
          }
          tool = t;
          if (tool) {
            tool.control.down = true;
            if (tool.select) {
              tool.select();
            }
          }
        } else if (tool) {
          tool.control.down = true;
        }
      } });
    this.children.forEach(function (ch) {
      var proto = zap.find_prototype(ch.elem.dataset.tool);
      if (proto) {
        var tool = Object.create(proto).init();
        tool.control = ch;
        ch.tool = tool;
        ui.listen(ch, "@pushed", function (e) {
          this.tool = tool;
        }.bind(this));
      }
    }, this);
    var target = document.querySelector(this.elem.dataset.target);
    if (!target) {
      console.warn("No target for toolbar", this.elem);
    } else {
      target.addEventListener("mousedown", this, false);
      target.addEventListener("mousemove", this, false);
      target.addEventListener("mouseup", this, false);
    }
    var sel = document.getElementById(this.elem.dataset.selected);
    if (sel) {
      this.tool = sel.ui.tool;
    }
    return this;
  };

  ui.toolbar.handleEvent = function (e) {
    if (this.tool && this.tool[e.type]) {
      this.tool[e.type](e);
    }
  };




  // Initialize all ui controls depth-first
  function init_controls(elem, parent) {
    var proto = zap.find_prototype(elem.dataset.ui);
    if (proto) {
      parent = Object.create(proto).base_init(elem, parent);
    }
    for (var ch = elem.firstChild; ch; ch = ch.nextSibling) {
      if (ch.nodeType === window.Node.ELEMENT_NODE) {
        init_controls(ch, parent);
      }
    }
    if (proto) {
      parent.init();
    }
  }

  ui.init_controls = function () {
    init_controls(document.documentElement);
  };

}(window.ui = {}));
