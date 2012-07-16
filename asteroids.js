(function () {
  "use strict";

  var cosmos = zap.make_cosmos();
  cosmos.vb = document.querySelector("svg").viewBox.baseVal;
  cosmos.asteroids = cosmos.add_layer(document.getElementById("asteroids"));

  var ur_asteroid = Object.create(zap.sprite);

  ur_asteroid.set_position = function () {
    var w = this.parent.parent.vb.width;
    var h = this.parent.parent.vb.height;
    this.x = (this.x + w) % w;
    this.y = (this.y + h) % h;
  };

  // Make a new asteroid, size 1, 2, or 3 (from smallest to largest)
  cosmos.make_asteroid = function (size) {
    var asteroid = zap.make_sprite($path(), this.asteroids, ur_asteroid);
    var r = zap.p["ASTEROID_{0}_R".fmt(size)];
    var r_amp = zap.p["ASTEROID_{0}_R_AMP".fmt(size)];
    var sectors = zap.p["ASTEROID_{0}_SECTORS".fmt(size)];
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
    for (var i = 0, m = zap.p.STAR_DENSITY * this.vb.width * this.vb.height;
        i < m; ++i) {
      bg.appendChild($circle({ r: Math.random() * zap.p.STAR_RADIUS,
        cx: zap.random_int(0, this.vb.width),
        cy: zap.random_int(0, this.vb.height),
        "fill-opacity": Math.random() }));
    }
  };

  cosmos.make_asteroids = function (n) {
    zap.remove_children(this.asteroids);
    var r = Math.floor(Math.min(this.vb.width, this.vb.height) / 4);
    for (var i = 0; i < n; ++i) {
      var asteroid = this.make_asteroid(3);
      asteroid.parent.appendChild(asteroid.elem);
      var th = Math.random() * 2 * Math.PI;
      var rr = zap.random_int(r, r * 2);
      asteroid.position(this.vb.width / 2 + rr * Math.cos(th),
        this.vb.height / 2 + rr * Math.sin(th));
      asteroid.vx = zap.random_int_signed(zap.p.ASTEROID_V_MIN, zap.p.ASTEROID_V_MAX);
      asteroid.vy = zap.random_int_signed(zap.p.ASTEROID_V_MIN, zap.p.ASTEROID_V_MAX);
      asteroid.va = zap.random_int_signed(zap.p.ASTEROID_V_MIN, zap.p.ASTEROID_V_MAX) /
        zap.p.ASTEROID_VA_RATE;
    }
  };

  cosmos.init_stars();
  cosmos.make_asteroids(4);
  cosmos.running = true;

  document.getElementById("message").textContent = "ASTEROIDS";

}());
