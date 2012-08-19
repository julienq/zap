(function () {
  "use strict";

  // Douglas is made of triangles
  // Triangles are sprite with a flip property (flips around the y-axis)
  // -1 for left facing, 1 for right facing
  // TODO drag triangle to give direction: horizontal movement, vertical
  // contraction, duck, etc.
  $.triangle = Object.create(zap.sprite);
  $.triangle.vmin = $DOUG_V[0];
  $.triangle.vmax = $DOUG_V[1];
  $.triangle.init = function (elem) {
    elem.appendChild($use("#" + elem.dataset.shape));
    var target = elem.appendChild($use("#" + elem.dataset.target));
    target.addEventListener("touchstart", this, false);
    target.addEventListener("touchmove", this, false);
    target.addEventListener("touchend", this, false);
    this.h = 0;
    return zap.sprite.init.call(this, elem);
  };
  $.triangle.handleEvent = function (e) {
    if (e.type === "touchstart") {
      this.p = zap.point_from_event(e);
      this.line = this.elem.parentNode.appendChild($line({ stroke: "#f88",
        x1: this.p.x, y1: this.p.y, x2: this.p.x, y2: this.p.y }));
    } else if (e.type === "touchmove") {
      if (this.line) {
        var p = zap.point_from_event(e);
        if (p.x > this.p.x) {
          this.h = 0;
        } else {
          this.h = 180;
        }
        this.a = $DOUG_ACCEL;
        this.line.setAttribute("x2", p.x);
        this.line.setAttribute("y2", p.y);
      }
    } else if (e.type === "touchend") {
      if (this.line) {
        this.line.parentNode.removeChild(this.line);
        delete this.line;
        delete this.p;
        this.a = $DOUG_DECEL;
      }
    }
  };
  $.triangle.set_transform = function () {
    this.elem.setAttribute("transform",
      "translate({0}, {1}) rotate({2}) scale({3}, {4})".fmt(this.x, this.y,
        this.r, this.s * (this.h === 0 ? 1 : -1), this.s));
    if (this.v > 0) {
      if (this.x - this.parent.x < $PLAY_AREA[0]) {
        var x = $PLAY_AREA[0] - this.x;
        this.parent.parent.children.forEach(function (p) {
          p.x = x;
        })
      } else if (this.x - this.parent.x > $PLAY_AREA[1]) {
        var x = $PLAY_AREA[1] - this.x;
        this.parent.parent.children.forEach(function (p) {
          p.x = x;
        })
      }
    }
  };

  var cosmos = Object.create(zap.cosmos).init();

}());
