(function () {
  "use strict";

  // Custom sprite classes for the eyes and the ghosts
  $.eyes = Object.create(zap.sprite);
  $.ghost = Object.create(zap.sprite);

  var W, H, LEVEL;


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
      e.preventDefault();
      this.p = zap.point_from_event(e);
    } else if (e.type === "mousemove" || e.type === "touchmove") {
      if (this.p) {
        var p = zap.point_from_event(e);
        this.h = zap.rad2deg(Math.atan2(p.y - this.y, p.x - this.x));
        this.a = this.accel;
        this.p = p;
      }
    } else if (e.type === "mouseup" || e.type === "touchend") {
      if (this.p) {
        delete this.p;
        this.a = this.decel;
      }
    }
  };

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
    }
    if (this.ghost) {
      var op = parseFloat(this.ghost.elem.getAttribute("stroke-opacity")) -
        $GHOST_FADE * dt;
      if (op <= 0) {
        this.release(true);
      } else {
        this.ghost.elem.setAttribute("stroke-opacity", op);
        this.ghost.x = this.x;
        this.ghost.y = this.y;
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
    this.ghost.v = 0;
    zap.play_sound("catch-sound", $VOLUME);
    update_score(parseFloat(this.ghost.elem.getAttribute("stroke-opacity")),
        this.ghost.elem.getAttribute("stroke"));
    return this;
  };

  $.eyes.release = function (free) {
    this.ghost.remove_self();
    delete this.ghost;
    if (free) {
      cosmos.$eyes.invicible();
      update_score(0);
    }
  };


  // Create a ghost with random color/position

  $.ghost.init = function (elem) {
    var color = zap.random_element($GHOST_COLOR);
    elem.setAttribute("stroke", color);
    elem.setAttribute("stroke-opacity", zap.random_number($GHOST_OPACITY));
    this.frame = 0;
    this.next_frame = $GHOST_FRAME_DUR;
    this.shape = elem.appendChild($use("#ghost-0"));
    elem.appendChild($use("#eye-sockets"));
    if (LEVEL[color] > 0) {
      elem.appendChild($use("#nose"));
      if (LEVEL[color] > 1) {
        elem.appendChild($use("#mouth"));
        if (Math.random() < $GHOST_MOUSTACHE_P) {
          elem.appendChild($use("#moustache"));
        }
        if (Math.random() < $GHOST_GOATEE_P) {
          elem.appendChild($use("#goatee"));
        }
      }
    }
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
      this.remove_self();
    }
  };


  // Float then see if we capture the eyes
  $.ghost.will_update = function (dt) {
    this.x += zap.random_number(-dt * $FLOATING, dt * $FLOATING);
    this.y += zap.random_number(-dt * $FLOATING, dt * $FLOATING);
  };


  // Initialize the cosmos
  var cosmos = $.cosmos = Object.create(zap.cosmos).init();
  cosmos.next_ghost = zap.random_number($GHOST_PERIOD);
  var vb = cosmos.elem.viewBox.baseVal;
  W = vb.width;
  H = vb.height;
  LEVEL = {};
  $GHOST_COLOR.forEach(function (color) {
    LEVEL[color] = 0;
  });

  // Keep track of current color and opacity
  var update_score = (function () {
    var score = { op: 0 };
    var g = document.getElementById("score"); 
    return function update_score(op, color) {
      if (color !== score.color) {
        zap.remove_children(g);
        score.color = color;
        score.op = 0
      }
      score.op += op;
      if (color) {
        var level = Math.floor(score.op / 3);
        if (level > LEVEL[score.color]) {
          zap.play_sound("levelup-sound", $VOLUME);
        }
        LEVEL[score.color] = level;
      }
      console.log("Score =", score.op, score.op - Math.floor(score.op));
      for (var i = 0, n = g.childNodes.length, m = Math.ceil(score.op),
        gh = g.firstChild; i < m; ++i, gh = gh.nextSibling) {
        if (!gh) {
          gh = g.appendChild($use("#ghost-{0}".fmt(Math.random() < 0.5 ? 0 : 1),
            { x: g.dataset.w * i, fill: score.color }));
        }
        gh.setAttribute("fill-opacity",
          i < m - 1 ? 1 : score.op - Math.floor(score.op));
      }
    }
  }());

  cosmos.will_update = function (dt) {
    if (this.$eyes.invicibility < 0 && this.$eyes.a <= 0) {
      var max_ghost = this.$eyes.ghost;
      var max_op = max_ghost ?
        parseFloat(max_ghost.elem.getAttribute("stroke-opacity")) : 0;
      this.$ghosts.children.forEach(function (ghost) {
        if (zap.dist(ghost, this.$eyes) < $GHOST_RADIUS) {
          var op = parseFloat(ghost.elem.getAttribute("stroke-opacity"));
          if (op > max_op) {
            max_op = op;
            max_ghost = ghost;
          }
        }
      }, this);
      if (max_ghost && max_ghost !== this.$eyes.ghost) {
        if (this.$eyes.ghost) {
          this.$eyes.release(false);
        }
        this.$eyes.capture(max_ghost);
      }
    }
    this.next_ghost -= dt;
    if (this.next_ghost < 0) {
      this.next_ghost = zap.random_number($GHOST_PERIOD);
      this.$ghosts.append_child(Object.create($.ghost).init($g()));
    }
  };


  // Pause and resume buttons

  $.pause = function () {
    cosmos.running = false;
    document.getElementById("pause").classList.add("hidden");
    document.getElementById("resume").classList.remove("hidden");
  };

  $.resume = function () {
    cosmos.running = true;
    document.getElementById("pause").classList.remove("hidden");
    document.getElementById("resume").classList.add("hidden");
  };

}.call(this.evolution = {}));
