(function () {
  "use strict";

  var W, H;

  function floating(dt) {
    this.x += zap.random_number(-dt * $FLOATING, dt * $FLOATING);
    this.y += zap.random_number(-dt * $FLOATING, dt * $FLOATING);
  }

  $.draggable = Object.create(zap.sprite);

  $.draggable.init = function (elem) {
    var target = elem.querySelector(".target");
    target.addEventListener("touchstart", this, false);
    target.addEventListener("touchmove", this, false);
    target.addEventListener("touchend", this, false);
    target.addEventListener("mousedown", this, false);
    document.addEventListener("mousemove", this, false);
    document.addEventListener("mouseup", this, false);
    return zap.sprite.init.call(this, elem);
  };

  $.draggable.handleEvent = function (e) {
    if (e.type === "mousedown" || e.type === "touchstart") {
      if (!this.ghost) {
        this.p = zap.point_from_event(e);
      }
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


  $.ghost = Object.create(zap.sprite);

  $.ghost.init = function (elem) {
    elem.setAttribute("fill", zap.random_element($GHOST_COLOR));
    elem.setAttribute("fill-opacity", zap.random_number($GHOST_OPACITY));
    this.frame = 0;
    this.next_frame = $GHOST_FRAME_DUR;
    this.shape = elem.appendChild($use("#ghost-0"));
    elem.appendChild($use("#eye-sockets"));
    zap.sprite.init.call(this, elem);
    this.v = zap.random_number($GHOST_V);
    this.h = 180;
    this.x = $GHOST_X;
    this.y = zap.random_number($GHOST_Y);
    return this;
  };

  $.ghost.did_update = function (dt) {
    this.next_frame -= dt;
    if (this.next_frame < 0) {
      this.next_frame = $GHOST_FRAME_DUR;
      this.frame = 1 - this.frame;
      this.shape.setAttributeNS(zap.XLINK_NS, "href",
          "#ghost-{0}".fmt(this.frame));
    }
    if (this.x < W - $GHOST_X) {
      if (cosmos.$eyes.ghost === this) {
        delete cosmos.$eyes.ghost;
        cosmos.$eyes.x = W / 2;
        cosmos.$eyes.invicible();
      }
      this.remove_self();
    }
  };


  var cosmos = Object.create(zap.cosmos).init();
  cosmos.next_ghost = zap.random_number($GHOST_PERIOD);
  var vb = cosmos.elem.viewBox.baseVal;
  W = vb.width;
  H = vb.height;

  // Float then see if we capture the eyes
  $.ghost.will_update = function (dt) {
    floating.call(this, dt);
    if (!cosmos.$eyes.ghost && cosmos.$eyes.invicibility < 0 &&
        cosmos.$eyes.a <= 0 && zap.dist(this, cosmos.$eyes) < $GHOST_RADIUS) {
      cosmos.$eyes.ghost = this;
      zap.play_sound("catch-sound", $VOLUME);
      delete cosmos.$eyes.p;
      cosmos.$eyes.a = 0;
      cosmos.$eyes.v = 0;
    }
  };

  cosmos.will_update = function (dt) {
    this.next_ghost -= dt;
    if (this.next_ghost < 0) {
      this.next_ghost = zap.random_number($GHOST_PERIOD);
      this.$ghosts.append_child(Object.create($.ghost).init($g()));
    }
  };

  cosmos.$eyes.invicible = function () {
    zap.play_sound("back-sound", $VOLUME);
    this.invicibility = $EYES_INVICIBILITY;
    this.elem.setAttribute("fill-opacity", 0.5);
  };

  cosmos.$eyes.invicible();

  cosmos.$eyes.will_update = function (dt) {
    if (this.invicibility > 0) {
      this.invicibility -= dt;
      if (this.invicibility <= 0) {
        this.elem.setAttribute("fill-opacity", 1);
      }
    }
    if (this.v > 0) {
      this.x = (this.x + W) % W;
      this.y = (this.y + H) % H;
      var h = zap.deg2rad(this.h);
      this.$left.x = this.$right.x = this.pupilRadius * Math.cos(h);
      this.$left.y = this.$right.y = this.pupilRadius * Math.sin(h);
    } else {
      this.$left.x = 0;
      this.$left.y = 0;
      this.$right.x = 0;
      this.$right.y = 0;
      if (this.ghost) {
        this.x = this.ghost.x;
        this.y = this.ghost.y;
      }
    }
  };

}.call(this.evolution = {}));
