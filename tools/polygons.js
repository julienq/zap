(function () {
  "use strict";

  var g;
  var points;
  var dragging;

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

  function drag_point(e) {
    points[points.length - 1].x = e.pageX;
    points[points.length - 1].y = e.pageY;
    g.lastChild.setAttribute("points", join_points(points));
    g.lastChild.previousSibling.setAttribute("cx", e.pageX);
    g.lastChild.previousSibling.setAttribute("cy", e.pageY);
  }

  function set_point(e) {
    var p = { x: e.pageX, y: e.pageY };
    if (points.length > 3 && zap.dist(p, points[0]) < 4) {
      var p = g.parentNode.replaceChild($polygon({ fill: "white",
        stroke: "none", points: join_points(points) }), g);
      g = null;
      return;
    }
  }

  var svg = document.querySelector("svg");
  var toolbar = document.querySelector("[data-ui='ui.toolbar']")._toolbar;

  toolbar.current = toolbar.controls[0];

  svg.addEventListener("mousedown", function (e) {
    e.preventDefault();
    if (toolbar.current.dataset.label === "polygon") {
      add_point(e);
      dragging = true;
    }
  }, false);

  svg.addEventListener("mousemove", function (e) {
    if (toolbar.current.dataset.label === "polygon" && dragging) {
      drag_point(e);
    }
  }, false);

  svg.addEventListener("mouseup", function (e) {
    if (toolbar.current.dataset.label === "polygon" && dragging) {
      set_point(e);
      dragging = false;
    }
  }, false);


}());
