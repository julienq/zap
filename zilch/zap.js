"use strict";

String.prototype.fmt = function () {
  var args = arguments;
  return this.replace(/%(\d+|%|\((\d+)\))/g, function (_, p, pp) {
    var p_ = parseInt(pp || p, 10);
    return p == "%" ? "%" : args[p_] == null ? "" : args[p_];
  });
};

(function (zap) {

  zap.clear = function (elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  };

  function append_children(elem, children) {
    if (children instanceof window.Node) {
      elem.appendChild(children);
    } else if (Array.isArray(children)) {
      children.forEach(append_children.bind(this, elem));
    }
  }

  zap.$ = function (name, attrs) {
    var elem = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (var attr in attrs) {
      elem.setAttribute(attr, attrs[attr]);
    }
    for (var i = 2, n = arguments.length; i < n; ++i) {
      append_children(elem, arguments[i]);
    }
    return elem;
  };

  ["circle", "g", "line", "path", "polyline", "rect"].forEach(function (tag) {
    zap["$" + tag] = zap.$.bind(zap, tag);
  });

  zap.random_number = function (min, max) {
    if (arguments.length == 1) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  };

  zap.random_int = function (min, max) {
    if (arguments.length == 1) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max + 1 - min));
  };

  var request_animation_frame = (window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (f) {
        return window.setTimeout(function () {
          f(Date.now());
        }, 15);
      }).bind(window);

  var cancel_animation_frame = (window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      window.clearTimeout).bind(window);

  zap.Loop = function () {
    this._every = [];
    this._at = [];
    this.update = function () {
      this.elapsed = Date.now() - this.start;
      for (var i = this._at.length - 1;
          i >= 0 && this._at[i][0] <= this.elapsed; --i);
      this._at.splice(i + 1).forEach(function (at) {
        at[1].call(this);
      }, this);
      this.req = request_animation_frame(this.update);
    }.bind(this);
    this.start = Date.now();
    this.update();
  };

  zap.Loop.prototype.at = function (f, t) {
    for (var i = this._at.length - 1; i >= 0 && this._at[i][0] < t; --i);
    this._at.splice(i, 0, [t, f]);
  };

  zap.Loop.prototype.every = function (f, dur) {
    var f_ = function () {
      var d = f_.next - this.elapsed + dur;
      f_.next += dur;
      this.at(f_, this.elapsed + d);
      f.call(this, this.elapsed - f_.last);
      f_.last = this.elapsed;
    };
    f_.last = this.elapsed;
    f_.next = this.elapsed;
    this.at(f_, this.elapsed);
  };

  zap.Loop.prototype.pause = function () {
    if (this.req) {
      cancel_animation_frame(this.req);
      delete this.req;
    }
  };

  zap.Loop.prototype.resume = function () {
    if (!this.req) {
      this.start = Date.now() - (this.elapsed || 0);
      this.update();
    }
  };

  zap.nop = function () {};

  zap.Drag = function (target) {
    this.target = target;
    this.target.addEventListener("mousedown", this, false);
    this.target.addEventListener("touchstart", this, false);
  };

  zap.Drag.prototype.transform = function (x, y) {
    return [x, y];
  };

  zap.Drag.prototype.onstart = zap.nop;
  zap.Drag.prototype.ondrag = zap.nop;
  zap.Drag.prototype.onend = zap.nop;

  zap.Drag.prototype.handleEvent = function (e) {
    if (e.type == "mousedown") {
      e.preventDefault();
      this._p = this.transform(e.clientX, e.clientY);
      if (this._p) {
        document.addEventListener("mousemove", this, false);
        document.addEventListener("mouseup", this, false);
        this.onstart(this._p[0], this._p[1]);
      }
    } else if (e.type == "touchstart") {
      e.preventDefault();
      e.stopPropagation();
      this._p = this.transform(e.targetTouches[0].clientX,
          e.targetTouches[0].clientY);
      if (this._p) {
        this.target.addEventListener("touchmove", this, false);
        this.target.addEventListener("touchend", this, false);
        this.onstart(this._p[0], this._p[1]);
      }
    } else if (e.type == "mousemove") {
      this.__p = this.transform(e.clientX, e.clientY);
      if (this.__p) {
        this.ondrag(this.__p[0] - this._p[0], this.__p[1] - this._p[1]);
      }
    } else if (e.type == "touchmove") {
      this.__p = this.transform(e.targetTouches[0].clientX,
          e.targetTouches[0].clientY);
      if (this.__p) {
        this.ondrag(this.__p[0] - this._p[0], this.__p[1] - this._p[1]);
      }
    } else if (e.type == "mouseup") {
      delete this._p;
      delete this.__p;
      document.removeEventListener("mousemove", this, false);
      document.removeEventListener("mouseup", this, false);
      this.onend();
    } else if (e.type == "touchend") {
      delete this._p;
      delete this.__p;
      this.target.removeEventListener("touchmove", this, false);
      this.target.removeEventListener("touchend", this, false);
      this.onend();
    }
  };

}(window.zap = {}));
