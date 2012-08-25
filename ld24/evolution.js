(function () {
  "use strict";

  // Custom sprite classes for the eyes and the ghosts
  $.eyes = Object.create(zap.sprite);
  $.ghost = Object.create(zap.sprite);

  var W, H;


  // Eyes

  // Initialize events for the eyes
  $.eyes.init = function (elem) {
    var target = elem.querySelector(".target");
    target.addEventListener("touchstart", this, false);
    target.addEventListener("touchmove", this, false);
    target.addEventListener("touchend", this, false);
    target.addEventListener("mousedown", this, false);
    document.addEventListener("mousemove", this, false);
    document.addEventListener("mouseup", this, false);
    this.invicibility = $EYES_INVICIBILITY;
    return zap.sprite.init.call(this, elem);
  };

  // Drag the eyes around when they are not in a ghost
  $.eyes.handleEvent = function (e) {
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

  // Update the eyes: check invicibility status; wrap around the screen; follow
  // a ghost when captured
  $.eyes.will_update = function (dt) {
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

  $.eyes.invicible = function () {
    zap.play_sound("back-sound", $VOLUME);
    this.invicibility = $EYES_INVICIBILITY;
    this.elem.setAttribute("fill-opacity", 0.5);
  };

  $.eyes.capture = function (ghost) {
    this.ghost = ghost;
    zap.play_sound("catch-sound", $VOLUME);
    delete this.p;
    this.a = 0;
    this.v = 0;
    return this;
  };

  $.eyes.release = function () {
    delete this.ghost;
    cosmos.$eyes.x = W / 2;
    cosmos.$eyes.invicible();
  };


  // Create a ghost with random color/position

  $.ghost.init = function (elem) {
    elem.setAttribute("stroke", zap.random_element($GHOST_COLOR));
    elem.setAttribute("stroke-opacity", zap.random_number($GHOST_OPACITY));
    this.frame = 0;
    this.next_frame = $GHOST_FRAME_DUR;
    this.shape = elem.appendChild($use("#ghost-0"));
    // elem.appendChild($use("#eye-sockets"));
    // elem.appendChild($use("#nose"));
    // elem.appendChild($use("#mouth"));
    // elem.appendChild($use("#moustache"));
    // elem.appendChild($use("#goatee"));
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
      if (this.eyes) {
        this.eyes.release();
        delete this.eyes;
      }
      this.remove_self();
    }
  };


  // Float then see if we capture the eyes
  $.ghost.will_update = function (dt) {
    this.x += zap.random_number(-dt * $FLOATING, dt * $FLOATING);
    this.y += zap.random_number(-dt * $FLOATING, dt * $FLOATING);
    if (!cosmos.$eyes.ghost && cosmos.$eyes.invicibility < 0 &&
        cosmos.$eyes.a <= 0 && zap.dist(this, cosmos.$eyes) < $GHOST_RADIUS) {
      this.eyes = cosmos.$eyes.capture(this);
    }
  };

  // Initialize the cosmos
  var cosmos = $.cosmos = Object.create(zap.cosmos).init();
  cosmos.next_ghost = zap.random_number($GHOST_PERIOD);
  var vb = cosmos.elem.viewBox.baseVal;
  W = vb.width;
  H = vb.height;

  cosmos.will_update = function (dt) {
    this.next_ghost -= dt;
    if (this.next_ghost < 0) {
      this.next_ghost = zap.random_number($GHOST_PERIOD);
      this.$ghosts.append_child(Object.create($.ghost).init($g()));
    }
  };

}.call(this.evolution = {}));
