(function () {
  "use strict";

  function message(text) {
    document.getElementById("message").textContent = text;
  }

  var cosmos = zap.make_cosmos();
  cosmos.vb = document.querySelector("svg").viewBox.baseVal;

  var ur_sprite = Object.create(zap.sprite);
  ur_sprite.set_position = function () {
    var w = this.cosmos.vb.width;
    var h = this.cosmos.vb.height;
    this.x = (this.x + w) % w;
    this.y = (this.y + h) % h;
  };

  // Make a new asteroid, size 1, 2, or 3 (from smallest to largest)
  cosmos.make_asteroid = function (size) {
    var asteroid = zap.make_sprite($path(), this.asteroids, ur_sprite);
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
      var p = zap.make_sprite($use("#plume"), this, ur_sprite);
      p.ttl = $PLUME_TTL;
      p.position(this.x + zap.random_int_around($SHIP_R),
          this.y + zap.random_int_around($SHIP_R),
          this.a + 180 + zap.random_int_around($PLUME_ARC));
      p.velocity = $PLUME_VELOCITY;
    }
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
    this.ship.max_velocity = $SHIP_V_MAX;
  };

  cosmos.init_controls = function () {
    document.addEventListener("keydown", function (e) {
      if (e.which === 32) {
        e.preventDefault();
        // cosmos.ship.fire();
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
