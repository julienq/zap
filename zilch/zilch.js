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

function clear(elem) {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
}

function el(name, attrs) {
  var elem = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (var attr in attrs) {
    elem.setAttribute(attr, attrs[attr]);
  }
  return elem;
}

function random_number(min, max) {
  if (arguments.length == 1) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
}

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

var SZ = 13;

var TREE_PROBABILITY = 0.35;

function Map(size) {
  this.size = size;
  this.tiles = [];
  for (var y = 0; y < size; ++y) {
    var row = [];
    this.tiles.push(row);
    for (var x = 0; x < size; ++x) {
      var z = this.z(x, y);
      row.push({ z: z, color: this.land_color(x, y, z) });
    }
  }
  for (var y = 0; y < size - 1; ++y) {
    for (var x = 0; x < size - 1; ++x) {
      var tree = this.tree(x, y);
      if (tree) {
        this.tiles[y][x].tree = tree;
      }
    }
  }
}

Map.prototype.z = function (x, y) {
  return Math.random();
};

Map.prototype.tree = function (x, y) {
  if (Math.random() < TREE_PROBABILITY) {
    x += Math.random();
    y += Math.random();
    var z = this.mean_z(x, y);
    var h = random_number(0.5, 1);
    return { x: x, y: y, z: z, color: this.tree_color(x, y), h : h,
      r: random_number(0.25, 0.5) };
  }
};

Map.prototype.land_color = function (x, y, z) {
  // return "hsl(%0,%1%,%2%)".fmt(random_int(345, 375) % 360,
  //    random_int(75, 100), random_int(35, 65));
  // return "hsl(%0,%1%,%2%)".fmt(random_int(165, 195), random_int(0, 50),
  //    random_int(85, 100));
  return "hsl(%0,%1%,%2%)".fmt(random_int(45, 105), random_int(50, 100),
      random_int(25, 75));
};

Map.prototype.tree_color = function (x, y, z) {
  return "hsl(%0,%1%,%2%)".fmt(random_int(105, 135), random_int(50, 100),
      random_int(50, 100));
};

Map.prototype.sea_color = function () {
  return "hsl(%0,%1%,%2%)".fmt(random_int(195, 205), random_int(70, 80),
      random_int(60, 70));
};

Map.prototype.tile = function (x, y) {
  return this.tiles[y] && this.tiles[y][x] || { z: 0, color: this.sea_color() };
};

Map.prototype.mean_z = function (x, y) {
  var x0 = Math.floor(x);
  var x1 = x0 == x ? x + 1 : Math.ceil(x);
  var y0 = Math.floor(y);
  var y1 = y0 == y ? y + 1 : Math.ceil(y);
  var z0 = this.tiles[y0][x0].z * (x1 - x) + this.tiles[y0][x1].z * (x - x0);
  var z1 = this.tiles[y1][x0].z * (x1 - x) + this.tiles[y1][x1].z * (x - x0);
  return z0 * (y1 - y) + z1 * (y - y0);
}

function Box(svg, box, size) {
  this.svg = svg
  this.tiles = box.querySelector(".tiles");
  this.size = size;
  var vb = svg.viewBox.baseVal;
  var w = vb.width / (SZ - 1) / 2;
  var h = w / 2;
  var v = h;
  var offset = vb.height - (2 * h * SZ - h);
  this.transform_point = function (x, y, z) {
    if (z instanceof Map) {
      z = z.tile(x, y).z;
    } else if (typeof z != "number" || isNaN(z)) {
      z = 0;
    }
    return [(x - y) * w, offset + (x + y) * h - z * v];
  };
};

var push = Array.prototype.push;

Box.prototype.draw_map = function (map) {
  this.draw_frame(map);
  this.draw_tiles(map);
};

Box.prototype.draw_frame = function(map) {
  var points = [];
  var sz = this.size - 1;
  push.apply(points, this.transform_point(sz, sz, -1));
  push.apply(points, this.transform_point(0, sz, -1));
  for (var x = 0; x < this.size; ++x) {
    push.apply(points, this.transform_point(x, sz, map));
  }
  for (var y = sz - 1; y >= 0; --y) {
    push.apply(points, this.transform_point(sz, y, map));
  }
  push.apply(points, this.transform_point(sz, 0, -1));
  return this.tiles.appendChild(el("polyline", { fill: "#333",
    points: points.join(" ")}));
}

Box.prototype.draw_tiles = function (map) {
  var sz = this.size - 1;
  for (var x = 0, y = 0; x < sz && y < sz;) {
    var g = this.tiles.appendChild(el("g"));
    var tile = g.appendChild(el("path"));
    var points = [];
    push.apply(points, this.transform_point(x, y, map));
    push.apply(points, this.transform_point(x + 1, y, map));
    push.apply(points, this.transform_point(x + 1, y + 1, map));
    push.apply(points, this.transform_point(x, y + 1, map));
    var color = map.tile(x, y).color;
    g.appendChild(el("path", { fill: color, stroke: color,
      d: String.prototype.fmt.apply("M%0,%1L%2,%3L%4,%5L%6,%7Z", points) }));
    this.draw_tree(g, map.tile(x, y).tree);
    ++x;
    --y;
    if (x == sz) {
      x = y + 2;
      y = sz - 1;
    } else if (y == -1) {
      y = x;
      x = 0;
    }
  }
};

Box.prototype.draw_tree = function (g, tree) {
  if (!tree) {
    return;
  }
  var p = this.transform_point(tree.x, tree.y, tree.z);
  var q = this.transform_point(tree.x, tree.y, tree.z + tree.h);
  var t = g.appendChild(el("g", { "class": "tree" }));
  t.appendChild(el("line", { x1: p[0], x2: q[0], y1: p[1], y2: q[1],
    stroke: "#444" }));
  t.appendChild(el("circle", { cx: q[0], cy: q[1], r: tree.r * (p[1] - q[1]),
    fill: tree.color }));
};

var box = new Box(document.querySelector("svg svg"),
    document.querySelector(".box"), SZ);
var map = new Map(SZ  / 2);
box.draw_map(map);

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

/*
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
*/
