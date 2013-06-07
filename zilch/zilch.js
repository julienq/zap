"use strict";

(function (zilch) {

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
    return x == 0 || y == 0 ? 0 : Math.random();
    /*var dx = this.size / 2 - x;
    var dy = this.size / 2 - y;
    var d = Math.sqrt(dx * dx + dy * dy);
    return (Math.sqrt(2) * this.size / 2 - d) / 2 - Math.random();*/
  };

  Map.prototype.tree = function (x, y) {
    if (Math.random() < TREE_PROBABILITY) {
      x += Math.random();
      y += Math.random();
      var z = this.mean_z(x, y);
      var h = zap.random_number(0.5, 1);
      return { x: x, y: y, z: z, color: this.tree_color(x, y), h : h,
        r: zap.random_number(0.25, 0.5) };
    }
  };

  Map.prototype.land_color = function (x, y, z) {
    // return "hsl(%0,%1%,%2%)".fmt(zap.random_int(345, 375) % 360,
    //    zap.random_int(75, 100), zap.random_int(35, 65));
    // return "hsl(%0,%1%,%2%)".fmt(zap.random_int(165, 195),
    //    zap.random_int(0, 50), zap.random_int(85, 100));
    return "hsl(%0,%1%,%2%)".fmt(zap.random_int(45, 105),
        zap.random_int(50, 100), zap.random_int(25, 75));
  };

  Map.prototype.tree_color = function (x, y, z) {
    return "hsl(%0,%1%,%2%)".fmt(zap.random_int(105, 135),
        zap.random_int(50, 100), zap.random_int(50, 100));
  };

  Map.prototype.sea_color = function () {
    return "hsl(%0,%1%,%2%)".fmt(zap.random_int(195, 205),
        zap.random_int(70, 80), zap.random_int(60, 70));
  };

  Map.prototype.tile = function (x, y) {
    return this.tiles[y] && this.tiles[y][x] ||
      { z: 0, color: this.sea_color() };
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
    this.svg = svg;
    this.tiles = box.querySelector(".tiles");
    this.size = size;
    var vb = svg.viewBox.baseVal;
    var w = vb.width / (SZ - 1) / 2;
    var h = w / 2;
    var v = h;
    var offset = vb.height - (2 * h * SZ - h);
    this.x = 0;
    this.y = 0;
    var mask = svg.appendChild(zap.$rect({ x: vb.x, y: vb.y, width: vb.width,
      height: vb.height, "fill-opacity": 0 }));
    this.drag = new zap.Drag(mask);
    this.drag.transform = function (x, y) {
      var p = svg.createSVGPoint();
      p.x = x;
      p.y = y;
      try {
        p = p.matrixTransform(svg.getScreenCTM().inverse());
        var y_ = (p.y - offset) / (2 * h) - p.x / (2 * w);
        return [p.x / w + y_, y_];
      } catch(e) {}
    };
    this.transform_point = function (x, y, z) {
      if (z instanceof Map) {
        z = z.tile(x, y).z;
      } else if (typeof z != "number" || isNaN(z)) {
        z = 0;
      }
      x -= this.x;
      y -= this.y;
      return [(x - y) * w, offset + (x + y) * h - z * v];
    };
  };

  var push = Array.prototype.push;

  Box.prototype.draw_map = function (map) {
    zap.clear(this.tiles);
    this.draw_frame(map);
    this.draw_tiles(map);
  };

  Box.prototype.draw_frame = function(map) {
    var points = [];
    var sz = this.size - 1;
    var x_ = this.size - 1 + this.x;
    var y_ = this.size - 1 + this.y;
    push.apply(points, this.transform_point(x_, y_, -1));
    push.apply(points, this.transform_point(this.x, y_, -1));
    for (var x = 0; x < this.size; ++x) {
      push.apply(points, this.transform_point(x + this.x, y_, map));
    }
    for (var y = sz - 1; y >= 0; --y) {
      push.apply(points, this.transform_point(x_, y + this.y, map));
    }
    push.apply(points, this.transform_point(x_, this.y, -1));
    return this.tiles.appendChild(zap.$polyline({ fill: "#333",
      points: points.join(" ")}));
  }

  Box.prototype.draw_tiles = function (map) {
    var sz = this.size - 1;
    for (var x = 0, y = 0; x < sz && y < sz;) {
      var x_ = x + this.x;
      var y_ = y + this.y;
      var g = this.tiles.appendChild(zap.$g());
      var tile = g.appendChild(zap.$path());
      var points = [];
      push.apply(points, this.transform_point(x_, y_, map));
      push.apply(points, this.transform_point(x_ + 1, y_, map));
      push.apply(points, this.transform_point(x_ + 1, y_ + 1, map));
      push.apply(points, this.transform_point(x_, y_ + 1, map));
      var color = map.tile(x_, y_).color;
      g.appendChild(zap.$path({ fill: color, stroke: color,
        d: String.prototype.fmt.apply("M%0,%1L%2,%3L%4,%5L%6,%7Z", points) }));
      this.draw_tree(g, map.tile(x_, y_).tree);
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
    g.appendChild(zap.$g({ "class": "tree" },
      zap.$line({ x1: p[0], x2: q[0], y1: p[1], y2: q[1], stroke: "#444" }),
      zap.$circle({ cx: q[0], cy: q[1], r: tree.r * (p[1] - q[1]),
        fill: tree.color })));
  };

  var gbox = document.querySelector(".box");
  var box = new Box(gbox.parentNode, gbox, SZ);
  var map = new Map(SZ * 3);
  box.x = SZ;
  box.y = SZ;
  box.draw_map(map);

  var loop = new zap.Loop();
  loop.every(function (dt) {
    box.draw_map(map);
  }, 1000);

  window.pause = function () { loop.pause(); };
  window.resume = function () { loop.resume(); };

  box.drag.onstart = function (x, y) {
    this.__x0 = box.x;
    this.__y0 = box.y;
  };

  box.drag.ondrag = function (x, y) {
    var xx = Math.round(this.__x0 - x / 2);
    var yy = Math.round(this.__y0 - y / 2);
    if (xx != box.x || yy != box.y) {
      box.x = xx;
      box.y = yy;
      box.draw_map(map);
    }
  };

  box.drag.end = function () {
    delete this.__x0;
    delete this.__y0;
  };

}(window.zilch = {}));




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
