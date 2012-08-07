(function () {
  "use strict";

  var g;
  var points;
  var down;

  function join_points(points) {
    return points.map(function (p) { return p.x + "," + p.y; }).join(" ");
  }

  function add_point(e) {
    var p = { x: e.pageX, y: e.pageY };
    if (!g) {
      points = [];
      var svg = document.querySelector("svg");
      g = svg.appendChild($g());
      g.appendChild($polyline({ stroke: "white", fill: "none" }));
    }
    points.push(p);
    g.insertBefore($circle({ fill: "white", stroke: "none",
      cx: p.x, cy: p.y, r: 2 }), g.lastChild);
    g.lastChild.setAttribute("points", join_points(points));
  }

  function move_point(e) {
    points[points.length - 1].x = e.pageX;
    points[points.length - 1].y = e.pageY;
    g.lastChild.setAttribute("points", join_points(points));
    g.lastChild.previousSibling.setAttribute("cx", e.pageX);
    g.lastChild.previousSibling.setAttribute("cy", e.pageY);
  }

  function set_point(e) {
    var p = { x: e.pageX, y: e.pageY };
    if (points.length > 3 && zap.dist(p, points[0]) < 4) {
      g.parentNode.replaceChild($polygon({ fill: "white", stroke: "none",
        points: join_points(points) }), g);
      g = null;
      return;
    }
  }

  document.addEventListener("mousedown", function (e) {
    add_point(e);
    down = true;
  }, false);

  document.addEventListener("mousemove", function (e) {
    if (down) {
      move_point(e);
    }
  }, false);

  document.addEventListener("mouseup", function (e) {
    if (down) {
      set_point(e);
      down = false;
    }
  }, false);


}());
