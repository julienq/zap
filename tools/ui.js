(function (ui) {
  "use strict";

  var A = Array.prototype;


  // Custom events

  // Listen to a custom event. Listener is a function or an object whose
  // "handleEvent" function will then be invoked.
  ui.listen = function (target, type, listener) {
    if (!target) {
      console.warn("No target for {0} listener".fmt(type));
      return;
    }
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
    if (!e.source) {
      console.warn("No source for {0} notification".fmt(e.type));
      return;
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
    ui.remove_from_array(target[type], listener);
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



  function add_class(elem, k) {
    if (!zap.is_true(elem.dataset.noDefault)) {
      elem.classList.add(k);
    }
  }

  ui.toolbar = {
    init: function (elem) {
      this.elem = elem;
      elem._toolbar = this;
      this.controls = A.slice.call(elem.querySelectorAll("[data-ui]"));
      this.controls.forEach(function (c) {
        ui.listen(c, "@pushed", this);
      }, this);
      var current;
      Object.defineProperty(this, "current", { enumerable: true,
        get: function () { return current; },
        set: function (c) {
          if (c !== current) {
            if (current) {
              current.down = false;
            }
            if (c) {
              c.down = true;
            }
            current = c;
          }
        } });
      return this;
    },

    handleEvent: function (e) {
      if (e.type === "@pushed") {
        this.current = e.source;
      }
    }
  };

  ui.button = {
    init: function (elem) {
      this.elem = elem;
      add_class(elem, "ui-button");
      elem.setAttribute("aria-role", "button");
      elem.addEventListener("mousedown", this, false);
      elem.addEventListener("mouseup", this, false);
      var down = false;
      Object.defineProperty(elem, "down", { enumerable: true,
        get: function () { return down; },
        set: function (p) {
          down = !!p;
          ui.set_class_iff(this, "ui--down", p);
        } });
      return this;
    },

    handleEvent: function (e) {
      if (e.type === "mousedown") {
        e.preventDefault();
        this.__down = true;
        this.elem.classList.add("ui--down");
      } else if (e.type === "mouseup" && this.__down) {
        delete this.__down;
        this.elem.classList.remove("ui--down");
        ui.notify(this.elem, "@pushed");
      }
    }
  };

  A.forEach.call(document.querySelectorAll("[data-ui]"), function (elem) {
    var proto = zap.find_prototype(elem.dataset.ui);
    if (proto) {
      var control = Object.create(proto).init(elem);
    }
  });

}(window.ui = {}));
