(function () {
  "use strict";

  function collide_against(sprite, sprites) {
    if (sprite.disabled) {
      return;
    }
    for (var i = 0, n = sprites.length; i < n; ++i) {
      var dx = sprite.x - sprites[i].x;
      var dy = sprite.y - sprites[i].y;
      var d = sprite.r_collide + sprites[i].r_collide;
      if ((dx * dx + dy * dy) < (d * d)) {
        return sprites[i];
      }
    }
  }

  function message(text) {
    document.getElementById("message").textContent = text;
  }

  var cosmos = zap.make_cosmos();
  cosmos.vb = document.querySelector("svg").viewBox.baseVal;

  cosmos.updated = function (dt) {
    this.ship.sprites.forEach(function (bullet) {
      if (bullet.is_bullet) {
        var asteroid = collide_against(bullet, this.asteroids.sprites);
        if (asteroid) {
          bullet.remove();
          asteroid.split();
          if (this.asteroids.sprites.length === 0) {
            // finished level!
          }
        }
      }
    }, this);
    if (this.shaking > 0) {
      this.layers.forEach(function (layer) {
        layer.setAttribute("transform", "translate({0}, {1}) rotate({2})".fmt(
            zap.random_int_around(this.shaking),
            zap.random_int_around(this.shaking),
            zap.random_int_around(this.shaking)));
      }, this);
    }
  };

  cosmos.shake = function (dur) {
    this.shaking = $SHAKE_AMP;
    setTimeout(function () {
      this.shaking = 0;
      this.layers.forEach(function (layer) {
        layer.removeAttribute("transform");
      });
    }.bind(this), $SHAKE_DUR);
  }

  var ur_sprite = Object.create(zap.sprite);
  ur_sprite.set_position = function () {
    var w = this.cosmos.vb.width;
    var h = this.cosmos.vb.height;
    this.x = (this.x + w) % w;
    this.y = (this.y + h) % h;
  };

  var ur_asteroid = Object.create(ur_sprite);

  ur_asteroid.split = function () {
    this.cosmos.shake();
    zap.play_sound("explosion_asteroid_sound", $VOLUME);
    for (var i = 0, n = 2 * window["$ASTEROID_{0}_SECTORS".fmt(this.size)];
        i < n; ++i) {
      var debris = zap.make_particle($use("#debris"), this.parent,
          zap.random_int_amp($DEBRIS_TTL, $DEBRIS_TTL_AMP), ur_sprite);
      var th = Math.random() * 2 * Math.PI;
      debris.position(this.x + this.r_collide * Math.cos(th),
          this.y + this.r_collide * Math.sin(th), zap.random_int(0, 360));
      debris.vx = zap.random_int_signed($ASTEROID_V_MIN, $ASTEROID_V_MAX);
      debris.vy = zap.random_int_signed($ASTEROID_V_MIN, $ASTEROID_V_MAX);
      debris.va = zap.random_int_signed($ASTEROID_V_MIN, $ASTEROID_V_MAX) /
        $ASTEROID_VA_RATE;
    }
    if (this.size > 1) {
      var a1 = this.cosmos.make_asteroid(this.size - 1);
      a1.position(this.x, this.y);
      a1.vx = this.vx * $SPEEDUP;
      a1.vy = -this.vy * $SPEEDUP;
      a1.va = this.va * $SPEEDUP;
      var a2 = this.cosmos.make_asteroid(this.size - 1);
      a2.position(this.x, this.y);
      a2.vx = -this.vx * $SPEEDUP;
      a2.vy = this.vy * $SPEEDUP;
      a2.va = -this.va * $SPEEDUP;
    }
    this.remove();
  }

  // Make a new asteroid, size 1, 2, or 3 (from smallest to largest)
  cosmos.make_asteroid = function (size) {
    var asteroid = zap.make_sprite($path(), this.asteroids, ur_asteroid);
    asteroid.size = size;
    var r = window["$ASTEROID_{0}_R".fmt(size)];
    var r_amp = window["$ASTEROID_{0}_R_AMP".fmt(size)];
    var sectors = window["$ASTEROID_{0}_SECTORS".fmt(size)];
    var points = [];
    asteroid.r = 0;
    for (var i = 0; i < sectors; ++i) {
      var th = i * (2 * Math.PI / sectors);
      var r = r + zap.random_int(-r_amp, r_amp);
      if (r > asteroid.r) {
        asteroid.r = r;
      }
      points.push([r * Math.cos(th), r * Math.sin(th)]);
    }
    asteroid.r_collide = r;
    asteroid.elem.setAttribute("d", "M{0}Z".fmt(points.map(function (p) {
      return p.join(",");
    }).join("L")));
    return asteroid;
  };

  // Make a starry field
  cosmos.init_stars = function () {
    var bg = document.getElementById("background");
    zap.remove_children(bg);
    for (var i = 0, m = $STAR_DENSITY * this.vb.width * this.vb.height;
        i < m; ++i) {
      bg.appendChild($circle({ r: Math.random() * $STAR_RADIUS,
        cx: zap.random_int(0, this.vb.width),
        cy: zap.random_int(0, this.vb.height),
        "fill-opacity": Math.random() }));
    }
  };

  // Make n asteroids
  // TODO reset a list of asteroids (for restarting after dying)
  cosmos.make_asteroids = function (n) {
    if (!this.asteroids) {
      this.asteroids = this.add_layer(document.getElementById("asteroids"));
    }
    var r = Math.floor(Math.min(this.vb.width, this.vb.height) / 4);
    for (var i = 0; i < n; ++i) {
      var asteroid = this.make_asteroid(3);
      var th = Math.random() * 2 * Math.PI;
      var rr = zap.random_int(r, r * 2);
      asteroid.position(this.vb.width / 2 + rr * Math.cos(th),
        this.vb.height / 2 + rr * Math.sin(th));
      asteroid.vx = zap.random_int_signed($ASTEROID_V_MIN, $ASTEROID_V_MAX);
      asteroid.vy = zap.random_int_signed($ASTEROID_V_MIN, $ASTEROID_V_MAX);
      asteroid.va = zap.random_int_signed($ASTEROID_V_MIN, $ASTEROID_V_MAX) /
        $ASTEROID_VA_RATE;
    }
  };


  var ur_ship = Object.create(ur_sprite);

  ur_ship.set_position = function () {
    ur_sprite.set_position.call(this);
    if (this.acceleration > 0 && Math.random() < $PLUME_P) {
      var p = zap.make_particle($use("#plume"), this, $PLUME_TTL, ur_sprite);
      p.position(this.x + zap.random_int_around(this.r),
          this.y + zap.random_int_around(this.r),
          this.a + 180 + zap.random_int_around($PLUME_ARC));
      p.velocity = $PLUME_VELOCITY;
    }
  };

  ur_ship.fire = function () {
    if (this.disabled) {
      return;
    }
    var now = Date.now();
    if (now - this.last_shot < $FIRE_RATE) {
      return;
    }
    this.last_shot = now;
    var bullet = zap.make_particle($use("#bullet"), this,
        $BULLET_RANGE / $BULLET_V, ur_sprite);
    bullet.is_bullet = true;
    bullet.r = 0;
    bullet.r_collide = 0;
    var th = zap.deg2rad(this.a);
    bullet.x = this.x + this.r * Math.cos(th);
    bullet.y = this.y + this.r * Math.sin(th);
    bullet.vx = $BULLET_V * Math.cos(th);
    bullet.vy = $BULLET_V * Math.sin(th);
    zap.play_sound("bullet_sound", $VOLUME);
  };

  cosmos.make_ship = function () {
    var ship = zap.make_sprite($use("#ship"), this.player_layer, ur_ship);
    ship.position(this.vb.width / 2, this.vb.height / 2, 270);
    return ship;
  };

  cosmos.init_player = function () {
    if (!this.player_layer) {
      this.player_layer = cosmos.add_layer(document.getElementById("player"));
    }
    this.ship = this.make_ship();
    this.ship.velocity = 0;
    this.ship.r = $SHIP_R;
    this.ship.r_collide = $SHIP_R_COLLIDE;
    this.ship.max_velocity = $SHIP_V_MAX;
  };

  cosmos.init_controls = function () {
    document.addEventListener("keydown", function (e) {
      if (e.which === 32) {
        e.preventDefault();
        this.ship.fire();
      } if (e.which === 37) {
        e.preventDefault();
        this.ship.va = -$SHIP_VA;
      } else if (e.which === 38) {
        e.preventDefault();
        this.ship.acceleration = $SHIP_ACCELERATION;
      } else if (e.which === 39) {
        e.preventDefault();
        this.ship.va = $SHIP_VA;
      } else if (e.which === 40) {
        e.preventDefault();
      }
    }.bind(this));
    document.addEventListener("keyup", function (e) {
      if (e.which === 32) {
        e.preventDefault();
      } else if (e.which === 37) {
        e.preventDefault();
        this.ship.va = 0;
      } else if (e.which === 38) {
        e.preventDefault();
        this.ship.acceleration = $SHIP_DECELERATION;
      } else if (e.which === 39) {
        e.preventDefault();
        this.ship.va = 0;
      } else if (e.which === 40) {
        e.preventDefault();
        this.hyperspace();
      }
    }.bind(this));
  };

  function flash(k) {
    document.body.classList.add(k);
    window.setTimeout(function () {
      document.body.classList.remove(k);
    }, $FLASH_DELAY);
  }

  cosmos.hyperspace = function () {
    zap.play_sound("hyperspace_sound", $VOLUME);
    this.init_stars();
    this.ship.position(zap.random_int(0, this.vb.width),
      zap.random_int(0, this.vb.height), zap.random_int(0, 360));
    flash("hyperspace-{0}".fmt(zap.random_int(0, 5)));
  };

  cosmos.init_stars();
  cosmos.make_asteroids(4);
  cosmos.init_player();
  cosmos.init_controls();
  cosmos.running = true;
  message("ASTEROIDS");

}());
