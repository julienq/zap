(function () {
  "use strict";

  // Show additional message (smaller than the main message)
  function addl_message(text) {
    document.getElementById("addl-message").textContent = text;
  }

  // Set the string shown by the message
  function message(text, sound) {
    document.getElementById("message").textContent = text;
    if (sound) {
      zap.play_sound(sound, $VOLUME);
    }
  }

  // Flash the screen by setting a class k on the body (which redefines the
  // background color for instance)
  function flash(k) {
    document.body.classList.add(k);
    window.setTimeout(function () {
      document.body.classList.remove(k);
    }, $FLASH_DUR_MS);
  }


  var vb = document.querySelector("svg").viewBox.baseVal;
  var sprite = Object.create(zap.sprite);
  sprite.did_update = function () {
    this.x = (this.x + vb.width) % vb.width;
    this.y = (this.y + vb.height) % vb.height;
  };

  // Both asteroids and spaceships may explode, leaving some debris behind
  // Set the debris property of the sprite to leave debris
  // Set the shake_amp and shake_dur properties to shake the screen as well
  // Set the explision_sound property for sound
  sprite.explode = function () {
    zap.play_sound(this.explosion_sound, $VOLUME);
    for (var i = 0; i < this.debris; ++i) {
      var debris = this.parent
        .append_child(Object.create(sprite).init($use("#debris")));
      debris.ttl = zap.random_number($DEBRIS_TTL);
      debris.x = this.x;
      debris.y = this.y;
      debris.r = zap.random_int(360);
      debris.h = zap.random_int(360);
      debris.v = zap.random_int($ASTEROID_V);
      debris.vr = zap.random_int($ASTEROID_VR);
    }
    cosmos.shake(this.shake_amp, this.shake_dur);
    this.parent.remove_child(this);
  };

  var ship = Object.create(sprite);
  ship.explosion_sound = "explosion_ship_sound";
  ship.debris = $SHIP_DEBRIS;
  ship.radius = $SHIP_RADIUS;
  ship.r_collide = $SHIP_R_COLLIDE;
  ship.vmin = $SHIP_VMIN;
  ship.vmax = $SHIP_VMAX;

  ship.fire = function (h) {
    var now = Date.now();
    if (now - this.last_shot < $FIRE_RATE) {
      return;
    }
    this.last_shot = now;
    var bullet = this.parent.append_child(Object.create(sprite)
        .init($use("#bullet")));
    bullet.ttl = $BULLET_RANGE / $BULLET_V;
    bullet.r_collide =
      parseFloat(document.getElementById("bullet").getAttribute("r"));
    bullet.h = h || this.h;
    var th = zap.deg2rad(bullet.h);
    bullet.x = this.x;
    bullet.y = this.y;
    bullet.v = $BULLET_V;
    zap.play_sound("bullet_sound", $VOLUME);
  };

  // The ship produces a plume when it accelerates
  ship.will_update = function (dt) {
    if (this.a > 0) {
      for (var i = 0, n = zap.random_int($PLUME_N); i < n; ++i) {
        var p = this.parent.append_child(Object.create(sprite)
          .init($circle({ r: zap.random_int($PLUME_R) } )));
        p.elem.setAttribute("opacity", Math.random());
        p.ttl = zap.random_number($PLUME_TTL);
        var th = zap.deg2rad(this.h + 180 + zap.random_int_signed($PLUME_ARC));
        p.v = -this.v;
        p.h = this.h;
        p.x = this.x + this.radius * Math.cos(th);
        p.y = this.y + this.radius * Math.sin(th);
      }
    }
  };

  var saucer = Object.create(ship);

  saucer.radius = $SAUCER_RADIUS;
  saucer.r_collide = $SAUCER_R_COLLIDE;
  saucer.split = sprite.explode;

  saucer.did_update = function (dt) {
    if (this.x < 0 || this.x > vb.width) {
      delete this.next_shot;
      this.parent.remove_child(this);
    } else {
      this.next_shot -= dt * 1000;
      if (this.next_shot < 0) {
        this.fire(zap.random_int(360));
        this.next_shot = zap.random_int($SAUCER_T_FIRE);
      }
    }
  };


  var asteroid = Object.create(sprite);
  asteroid.explosion_sound = "explosion_asteroid_sound";
  asteroid.shake_amp = $SHAKE_AMP;
  asteroid.shake_dur = $SHAKE_DUR_MS;

  asteroid.init = function (elem, size) {
    this.size = size;
    var r = window["$ASTEROID_{0}_R".fmt(size)];
    var r_amp = window["$ASTEROID_{0}_R_AMP".fmt(size)];
    var sectors = window["$ASTEROID_{0}_SECTORS".fmt(size)];
    this.score = window["$ASTEROID_{0}_SCORE".fmt(size)];
    this.debris = 2 * sectors;
    var points = [];
    this.radius = 0;
    for (var i = 0; i < sectors; ++i) {
      var th = i * (2 * Math.PI / sectors);
      var r = r + zap.random_int(-r_amp, r_amp);
      if (r > this.radius) {
        this.radius = r;
      }
      points.push([r * Math.cos(th), r * Math.sin(th)]);
    }
    this.r_collide = r;
    elem.setAttribute("d", "M{0}Z".fmt(points.map(function (p) {
      return p.join(",");
    }).join("L")));
    return sprite.init.call(this, elem);
  };

  // Asteroids split into two smaller asteroids with perpendicular direction and
  // higher speed
  asteroid.split = function () {
    if (this.size > 1) {
      var a1 = cosmos.make_asteroid(this.size - 1);
      a1.x = this.x;
      a1.y = this.y;
      a1.h = this.h + 90;
      a1.v = this.v * $SPEEDUP;
      var a2 = cosmos.make_asteroid(this.size - 1);
      a2.x = this.x;
      a2.y = this.y;
      a2.h = this.h - 90;
      a2.v = this.v * $SPEEDUP;
    }
    this.explode();
  };

  var cosmos = Object.create(zap.cosmos)
    .init(document.getElementById("cosmos"));

  // Setting the score
  var score;
  Object.defineProperty(cosmos, "score", { enumerable: true,
    get: function () { return score; },
    set: function (s) {
      if ((s > score) && (score % $NEW_LIFE) > (s % $NEW_LIFE)) {
        this.add_life();
        zap.play_sound("new_life_sound", $VOLUME);
      }
      score = s;
      document.getElementById("score").textContent = score.toString();
    } });
  cosmos.score = 0;

  // Setting a new level
  var level;
  Object.defineProperty(cosmos, "level", { enumerable: true,
    get: function () { return level; },
    set: function (l) {
      level = l;
      message($LEVEL.fmt(level), "message_sound");
      window.setTimeout(function () {
        message("");
        this.make_asteroids(Math.min($ASTEROIDS_MIN + level - 1,
            $ASTEROIDS_MAX));
        this.children.saucers.remove_children();
        this.next_saucer = zap.random_int($SAUCER_T);
        this.init_player();
      }.bind(this), $READY_DUR_MS);
    } });

  // Add one life
  cosmos.add_life = function () {
    ++this.lives;
    var life = this.make_ship(this.children.lives);
    life.x = 3 * life.radius * this.children.lives.children.length;
    life.y = 3 * life.radius;
    life.r = 270;
  };

  // Show a message to "press any key" after a short delay
  cosmos.any_key = function () {
    window.setTimeout(function () {
      addl_message($ANY_KEY);
      this.can_start = true;
    }.bind(this), $READY_DELAY_MS);
  };

  // Check if the player dies from a collision with an asteroid
  // TODO: or a bullet fired from an enemy ship
  cosmos.check_player_die = function (asteroid) {
    if (this.ship) {
      var a = this.ship.collide_radius(this.children.asteroids.children) ||
        this.ship.collide_radius(this.children.saucers.children);
      if (a) {
        this.ship.explode();
        delete this.ship;
        this.children.lives.children[this.children.lives.children.length - 1]
          .explode();
        flash("explosion");
        if (--this.lives > 0) {
          window.setTimeout(function () {
            message($READY);
            window.setTimeout(function () {
              message("");
              this.children.saucers.remove_children();
              this.init_player();
            }.bind(this), $READY_DUR_MS);
          }.bind(this), $READY_DELAY_MS);
        } else {
          window.setTimeout(function () {
            message($GAME_OVER, "game_over_sound");
            this.any_key();
          }.bind(this), $READY_DELAY_MS);
        }
      }
    }
  };

  // Jump to hyperspace
  cosmos.hyperspace = function () {
    zap.play_sound("hyperspace_sound", $VOLUME);
    this.init_stars();
    this.ship.x = zap.random_int(vb.width);
    this.ship.y = zap.random_int(vb.height);
    this.ship.h = this.ship.r = zap.random_int(360);
    flash("hyperspace-{0}".fmt(zap.random_int(0, 5)));
  };

  // Initialize keyboard events
  // TODO improve keyboard handling
  cosmos.init_controls = function () {
    var handled;
    document.addEventListener("keydown", function (e) {
      var k = zap.describe_key(e);
      if (this.ship) {
        if (this.running) {
          if (k === "space") {
            this.ship.fire();
            handled = k;
          } else if (k === "left") {
            this.ship.vh = this.ship.vr = -$SHIP_VH;
            handled = k;
          } else if (k === "up") {
            this.ship.a = $SHIP_ACCEL;
            handled = k;
          } else if (k === "right") {
            this.ship.vh = this.ship.vr = $SHIP_VH;
            handled = k;
          }
        }
      } else if (this.can_start && !zap.is_key_special(e)) {
        handled = k;
      }
      if (handled) {
        e.preventDefault();
      }
    }.bind(this), false);
    document.addEventListener("keyup", function (e) {
      var k = zap.describe_key(e);
      if (this.ship) {
        if (this.running) {
          if (k === "left") {
            this.ship.vh = this.ship.vr = 0;
          } else if (k === "up") {
            this.ship.a = $SHIP_DECEL;
          } else if (k === "right") {
            this.ship.vh = this.ship.vr = 0;
          } else if (k === "down") {
            this.hyperspace();
          } else if (k === "s") {
            this.next_saucer = 0;
          }
        }
        if (k === "p") {
          if (cosmos.running) {
            message($PAUSED);
            cosmos.running = false;
          } else {
            message("");
            cosmos.running = true;
          }
        }
      } else if (this.can_start && k === handled) {
        cosmos.new_game();
      }
      handled = "";
    }.bind(this), false);
  };

  // Initialize lives
  cosmos.init_lives = function () {
    this.children.lives.remove_children();
    this.lives = 0;
    for (var i = 0; i < $LIVES; ++i) {
      this.add_life();
    }
  };

  // Initialize the player ship for a new game, new level or after death
  // Also resets the asteroids so that the player has a safe zone to start with
  cosmos.init_player = function () {
    this.make_asteroids(this.children.asteroids.children);
    this.ship = this.make_ship(this.children.player);
    this.ship.x = vb.width / 2;
    this.ship.y = vb.height / 2;
    this.ship.h = 270;
    this.ship.r = 270;
  };

  // Make a starry field
  cosmos.init_stars = function () {
    var bg = document.getElementById("background");
    zap.remove_children(bg);
    for (var i = 0, m = $STAR_DENSITY * vb.width * vb.height; i < m; ++i) {
      bg.appendChild($circle({ r: Math.random() * $STAR_RADIUS,
        cx: zap.random_int(0, vb.width),
        cy: zap.random_int(0, vb.height),
        "fill-opacity": Math.random() }));
    }
  };

  // Make a new asteroid, size 1, 2, or 3 (from smallest to largest)
  cosmos.make_asteroid = function (size) {
    return this.children.asteroids.append_child(Object.create(asteroid)
        .init($path(), size));
  };

  // Make n asteroids, or, if n is actually a list of asteroids, reset the
  // positions of the list of asteroids to create a safe zone for the ship
  cosmos.make_asteroids = function (n) {
    var r = Math.floor(Math.min(vb.width, vb.height) / 4);
    if (typeof n === "number") {
      this.children.asteroids.remove_children();
      for (var i = 0; i < n; ++i) {
        var a = this.make_asteroid(3);
        var th = zap.random_number(2 * Math.PI);
        var rr = zap.random_int(r, r * 2);
        a.x = vb.width / 2 + rr * Math.cos(th);
        a.y = vb.height / 2 + rr * Math.sin(th);
        a.h = zap.random_int(360);
        a.v = zap.random_int($ASTEROID_V);
        a.vr = zap.random_int($ASTEROID_VR);
      }
    } else {
      n.forEach(function (a) {
        var th = zap.random_number(2 * Math.PI);
        var rr = zap.random_int(r, r * 2);
        a.x = vb.width / 2 + rr * Math.cos(th);
        a.y = vb.height / 2 + rr * Math.sin(th);
      });
    }
  };

  // Instantiate a saucer if its time has come
  cosmos.make_saucer = function (dt) {
    this.next_saucer -= dt * 1000;
    if (this.next_saucer < 0) {
      this.next_saucer = zap.random_int($SAUCER_T);
      var s = this.children.saucers.append_child(Object.create(saucer)
          .init($use("#saucer")));
      s.x = Math.random() < 0.5 ? 0 : vb.width;
      s.y = zap.random_number($SAUCER_Y) * vb.height;
      s.r = zap.random_int($SAUCER_R);
      s.h = zap.random_int($SAUCER_R) + (s.x === 0 ? 0 : 180);
      s.v = zap.random_int($SAUCER_VELOCITY);
      s.score = $SAUCER_SCORE;
      s.next_shot = zap.random_int($SAUCER_T_FIRE);
    }
  };

  // Make a new player ship
  cosmos.make_ship = function (system) {
    return system.append_child(Object.create(ship).init($use("#ship")));
  };

  // Start a new game
  cosmos.new_game = function () {
    message("");
    addl_message("");
    this.score = 0;
    this.init_lives();
    this.can_start = false;
    this.level = 1;
  };

  // Start shaking with the given amplitude and duration (in milliseconds)
  cosmos.shake = function (amp, dur) {
    if (this.shaking) {
      window.clearTimeout(this.shaking.timeout);
    }
    this.shaking = { amp: amp, timeout: setTimeout(function () {
      delete this.shaking;
      this.children.forEach(function (system) {
        system.elem.removeAttribute("transform");
      });
    }.bind(this), dur) };
  }

  // Update the world on each tick: check destruction of asteroids or player,
  // shake the screen
  cosmos.did_update = function (dt) {
    if (this.ship) {
      this.children.lives.children.forEach(function (life) {
        life.r =
          zap.rad2deg(Math.atan2(this.ship.y - life.y, this.ship.x - life.x));
      }, this);
      this.children.player.children.forEach(function (bullet) {
        if (bullet.ttl) {
          var a = bullet.collide_radius(this.children.asteroids.children) ||
            bullet.collide_radius(this.children.saucers.children);
          if (a && !a.ttl) {
            bullet.parent.remove_child(bullet);
            this.score += a.score;
            a.split();
          }
        }
      }, this);
      this.children.saucers.children.forEach(function (bullet) {
        if (bullet.ttl) {
          var a = bullet.collide_radius(this.children.asteroids.children);
          if (a && !a.ttl) {
            bullet.parent.remove_child(bullet);
            a.split();
          }
        }
      }, this);
      if (this.children.asteroids.children.length === 0 &&
          this.children.saucers.children.length === 0) {
        flash("hyperspace-{0}".fmt(zap.random_int(0, 5)));
        this.ship.parent.remove_child(this.ship);
        this.ship = null;
        ++this.level;
      }
      this.check_player_die();
      this.make_saucer(dt);
    }
    if (this.shaking) {
      this.children.forEach(function (system) {
        system.elem.setAttribute("transform", "translate({0}, {1}) rotate({2})"
          .fmt(zap.random_int_around(this.shaking.amp),
            zap.random_int_around(this.shaking.amp),
            zap.random_int_around(this.shaking.amp)));
      }, this);
    }
  };


  // General setup
  cosmos.init_controls();
  cosmos.init_stars();
  message($TITLE, "message_sound");
  cosmos.running = true;
  cosmos.any_key();

}());
