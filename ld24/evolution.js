(function () {
  "use strict";

  $.draggable = Object.create(zap.sprite);

  // TODO wrap around
  $.draggable.init = function (elem) {
    var target = elem.querySelector(".target");
    if (target.ontouchstart) {
      target.addEventListener("touchstart", this, false);
      target.addEventListener("touchmove", this, false);
      target.addEventListener("touchend", this, false);
    } else {
      target.addEventListener("mousedown", this, false);
      document.addEventListener("mousemove", this, false);
      document.addEventListener("mouseup", this, false);
    }
    return zap.sprite.init.call(this, elem);
  };

  $.draggable.handleEvent = function (e) {
    if (e.type === "mousedown" || e.type === "touchstart") {
      this.p = zap.point_from_event(e);
      // TODO eyes follow the dragging direction
    } else if (e.type === "mousemove" || e.type === "touchmove") {
      if (this.p) {
        var p = zap.point_from_event(e);
        this.h = zap.rad2deg(Math.atan2(p.y - this.y, p.x - this.x));
        this.a = this.accel;
      }
    } else if (e.type === "mouseup" || e.type === "touchend") {
      if (this.p) {
        delete this.p;
        this.a = this.decel;
      }
    }
  };

  var cosmos = Object.create(zap.cosmos).init();

}.call(this.evolution = {}));
