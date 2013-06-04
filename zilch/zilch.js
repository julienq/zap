"use strict";

// Get some ideas from:
// http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/

String.prototype.fmt = function () {
  var args = arguments;
  return this.replace(/%(\d+|%|\((\d+)\))/g, function (_, p, pp) {
    var p_ = parseInt(pp || p, 10);
    return p == "%" ? "%" : args[p_] == null ? "" : args[p_];
  });
};

function random_int(min, max) {
  if (arguments.length == 1) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max + 1 - min));
}

var request_animation_frame = (window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame || function (f) {
    return window.setTimeout(function () {
      f(Date.now());
    }, 16);
  }).bind(window);

function Dragger(target) {
  target.addEventListener("mousedown", this, false);
};

Dragger.prototype.ondrag = function () {};

Dragger.prototype.reset = function () {
  this._x = this.__x;
  this._y = this.__y;
};

Dragger.prototype.handleEvent = function (e) {
  if (e.type == "mousedown") {
    e.preventDefault();
    this._x = e.clientX;
    this._y = e.clientY;
    document.addEventListener("mousemove", this, false);
    document.addEventListener("mouseup", this, false);
  } else if (e.type == "mousemove") {
    this.__x = e.clientX;
    this.__y = e.clientY;
    this._tx = this.__x - this._x;
    this._ty = this.__y - this._y;
    this.ondrag(e.clientX - this._x, e.clientY - this._y);
  } else if (e.type == "mouseup") {
    delete this._x;
    delete this._y;
    delete this.__x;
    delete this.__y;
    document.removeEventListener("mousemove", this, false);
    document.removeEventListener("mouseup", this, false);
  }
};


var svg = document.querySelector("svg svg");
var vb = svg.viewBox.baseVal;

var SZ = 13;
var TREE_PROBABILITY = 0.35;

var map = [];
for (var i = 0; i < SZ; ++i) {
  var row = [];
  map.push(row);
  for (var j = 0; j < SZ; ++j) {
    var square = { z: Math.random(), tree: Math.random() < TREE_PROBABILITY,
      // color: "hsl(%0,%1%,%2%)".fmt(random_int(345, 375) % 360,
      //    random_int(75, 100), random_int(35, 65)) };
      // color: "hsl(%0,%1%,%2%)".fmt(random_int(165, 195), random_int(0, 50),
      //    random_int(85, 100)) };
      color: "hsl(%0,%1%,%2%)".fmt(random_int(45, 105), random_int(50, 100),
          random_int(25, 75)) };
    row.push(square);
  }
}

var g = document.getElementById("grid");

var w = vb.width / (SZ - 1) / 2;
var h = w / 2;
var v = h;
function transform_point(x, y, z) {
  return [(x - y) * w, (x + y) * h - z * v];
}

function mean_z(map, x, y) {
  var x0 = Math.floor(x);
  var x1 = x0 == x ? x + 1 : Math.ceil(x);
  var y0 = Math.floor(y);
  var y1 = y0 == y ? y + 1 : Math.ceil(y);
  var z0 = map[y0][x0].z * (x1 - x) + map[y0][x1].z * (x - x0);
  var z1 = map[y1][x0].z * (x1 - x) + map[y1][x1].z * (x - x0);
  return z0 * (y1 - y) + z1 * (y - y0);
}

(function draw_map(map, g, tr) {
  var frame = g.appendChild(document
    .createElementNS("http://www.w3.org/2000/svg", "polyline"));
  frame.setAttribute("stroke", "white");
  frame.setAttribute("fill", "none");
  var p0 = transform_point(0, SZ - 1, map[SZ - 1][0].z);
  var p1 = transform_point(0, SZ - 1, -1);
  var p2 = transform_point(SZ - 1, SZ - 1, -1);
  var p3 = transform_point(SZ - 1, SZ - 1, map[SZ - 1][SZ - 1].z);
  var p4 = transform_point(SZ - 1, 0, -1);
  var p5 = transform_point(SZ - 1, 0, map[0][SZ - 1].z);
  frame.setAttribute("points", "%0,%1 %2,%3 %4,%5 %6,%7 %4,%5 %8,%9 %10,%11"
    .fmt(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], p4[0], p4[1],
      p5[0], p5[1]));
  for (var y = 0; y < SZ - 1; ++y) {
    for (var x = 0; x < SZ - 1; ++x) {
      var p = transform_point(x, y, map[y][x].z);
      var q = transform_point(x + 1, y, map[y][x + 1].z);
      var r = transform_point(x + 1, y + 1, map[y + 1][x + 1].z);
      var s = transform_point(x, y + 1, map[y + 1][x].z);
      var e = g.appendChild(document
        .createElementNS("http://www.w3.org/2000/svg", "path"));
      e.setAttribute("fill", map[y][x].color);
      e.setAttribute("stroke", map[y][x].color);
      e.setAttribute("d", "M%0,%1L%2,%3L%4,%5L%6,%7Z".fmt(p[0], p[1], q[0],
          q[1], r[0], r[1], s[0], s[1]));
      if (map[y][x].tree) {
        var xt = x + Math.random();
        var yt = y + Math.random();
        var zt = mean_z(map, xt, yt);
        var p_ = transform_point(xt, yt, zt);
        var tree = tr.appendChild(document
          .createElementNS("http://www.w3.org/2000/svg", "g"));
        var trunk = tree.appendChild(document
          .createElementNS("http://www.w3.org/2000/svg", "line"));
        trunk.setAttribute("x1", p_[0]);
        trunk.setAttribute("x2", p_[0]);
        trunk.setAttribute("y1", p_[1]);
        p_[1] -= (0.5 + Math.random() / 2) * v;
        trunk.setAttribute("y2", p_[1]);
        trunk.setAttribute("stroke", "#444");
        var leaves = tree.appendChild(document
          .createElementNS("http://www.w3.org/2000/svg", "circle"));
        leaves.setAttribute("cx", p_[0]);
        leaves.setAttribute("cy", p_[1]);
        leaves.setAttribute("r", v * 0.35);
        leaves.setAttribute("fill", "hsl(%0,%1%,%2%)".fmt(random_int(105, 135),
              random_int(75, 100), random_int(25, 50)));
      }
    }
  }
}(map, g, document.getElementById("trees")));

/*
var player = { x: random_int(0, SZ - 2) + Math.random(),
  y: random_int(0, SZ - 2) + Math.random(),
  g: document.getElementById("player") };
var line = player.g.appendChild(document
    .createElementNS("http://www.w3.org/2000/svg", "line"));
function update_player() {
  var p = transform_point(player.x, player.y, mean_z(map, player.x, player.y));
  line.setAttribute("x1", p[0]);
  line.setAttribute("y1", p[1]);
  line.setAttribute("x2", p[0]);
  line.setAttribute("y2", p[1] - v / 3);
}

var dx = 0;
var dy = 0;
document.addEventListener("keydown", function (e) {
  if (e.keyCode == 37) {
    dx = -1;
  } else if (e.keyCode == 39) {
    dx = 1;
  }
  if (e.keyCode == 38) {
    dy = -1;
  } else if (e.keyCode == 40) {
    dy = 1;
  }
}, false);
document.addEventListener("keyup", function (e) {
  if (e.keyCode == 37 || e.keyCode == 39) {
    dx = 0;
  }
  if (e.keyCode == 38 || e.keyCode == 40) {
    dy = 0;
  }
}, false);

(function move_player() {
  player.x = Math.max(0, Math.min(SZ - 1.1, player.x + dx * 0.025));
  player.y = Math.max(0, Math.min(SZ - 1.1, player.y + dy * 0.025));
  update_player();
  // request_animation_frame(move_player);
}());
*/

var clouds = document.getElementById("clouds");
for (var i = 0; i < SZ / 2; ++i) {
  var cloud = clouds.appendChild(document.
      createElementNS("http://www.w3.org/2000/svg", "ellipse"));
  var p = transform_point(random_int(0, SZ), random_int(0, SZ),
      2 + Math.random() * SZ);
  var r = random_int(1, 2);
  cloud.setAttribute("fill", "hsl(0,0%,%0%)".fmt(random_int(80, 100)));
  cloud.setAttribute("cx", p[0]);
  cloud.setAttribute("cy", p[1]);
  cloud.setAttribute("rx", r * w);
  cloud.setAttribute("ry", r * h);
}
