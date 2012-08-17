(function () {
  "use strict";

  // Douglas is made of triangles
  // Triangles are sprite with a flip property (flips around the y-axis)
  // -1 for left facing, 1 for right facing
  // TODO drag triangle to give direction: horizontal movement, vertical
  // contraction, duck, etc.
  $.triangle = Object.create(zap.sprite);
  $.triangle.init = function (elem) {
    elem.addEventListener("touchstart", this, false);
    elem.addEventListener("touchmove", this, false);
    elem.addEventListener("touchend", this, false);
    this.flip = 1;
    return zap.sprite.init.call(this, elem);
  };
  $.triangle.handleEvent = function (e) {
    if (e.type === "touchstart") {
    } else if (e.type === "touchmove") {
    } else if (e.type === "touchend") {
    }
  };
  $.triangle.set_transform = function () {
    this.elem.setAttribute("transform",
      "translate({0}, {1}) rotate({2}) scale({3}, {4})".fmt(this.x, this.y,
        this.r, this.s * this.flip, this.s));
  };

  var cosmos = Object.create(zap.cosmos).init();

}());
