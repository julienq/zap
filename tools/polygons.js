(function () {
  "use strict";

  var svg = document.querySelector("svg");

  // Tools

  function join_points(points) {
    return points.map(function (p) { return p.x + "," + p.y; }).join(" ");
  }

  function make_point(e) {
    var p = { x: e.clientX, y: e.clientY };
    p.elem = $circle({ stroke: "none", fill: "white", r: 2, cx: p.x, cy: p.y });
    return p;
  }

  $.polygon = {
    init: function () {
      this.svg = svg;
      return this;
    },

    mousedown: function (e) {
      e.preventDefault();
      delete this.line;
      if (!this.g) {
        this.g = this.svg.appendChild($g());
        this.points = [make_point(e)];
        this.g.appendChild(this.points[0].elem);
      }
    },

    mousemove: function (e) {
      if (this.g) {
        var p = this.points[this.points.length - 1];
        if (!this.line) {
          var q = make_point(e);
          this.points.push(q);
          this.g.appendChild(q.elem);
          this.line = this.g.appendChild($line({ stroke: "white",
            x1: p.x, y1: p.y, x2: q.x, y2: q.y }));
          p = q;
        }
        p.x = e.clientX;
        p.y = e.clientY;
        p.elem.setAttribute("cx", p.x);
        p.elem.setAttribute("cy", p.y);
        this.line.setAttribute("x2", p.x);
        this.line.setAttribute("y2", p.y);
        this.points[0].elem.setAttribute("fill", "white");
        if (this.points.length > 2) {
          var d = zap.dist(this.points[0], this.points[this.points.length - 1]);
          if (d < 5) {
            this.points[0].elem.setAttribute("fill", "red");
          }
        }
      }
    },

    mouseup: function (e) {
      if (this.points.length > 2) {
        var d = zap.dist(this.points[0], this.points[this.points.length - 1]);
        if (d < 5) {
          var p = $polygon({ fill: "white", stroke: "none",
            points: join_points(this.points), "data-selectable": true });
          this.g.parentNode.replaceChild(p, this.g);
          this.reset();
          return;
        }
      }
    },

    reset: function (e) {
      if (this.g && this.g.parentNode) {
        this.g.parentNode.removeChild(this.g);
      }
      delete this.g;
      delete this.line;
    },

    unselect: function () {
      this.reset();
    }
  };


  // Selection

  var selection;

  function override_attr(elem, attr, val) {
    elem["__" + attr] = elem.getAttribute(attr);
    elem.setAttribute(attr, val);
  }

  function restore_attr(elem, attr) {
    elem.setAttribute(attr, elem["__" + attr]);
    delete elem["__" + attr];
  }

  function select_elem(elem) {
    if (!elem || !zap.is_true(elem.dataset.selectable)) {
      elem = null;
    }
    if (selection !== elem) {
      if (selection) {
        restore_attr(selection, "fill");
      }
      if (elem) {
        override_attr(elem, "fill", "#08f");
      }
      selection = elem;
    }
  };

  $.select = {
    init: function () {
      return this;
    },

    mousedown: function (e) {
      e.preventDefault();
      select_elem(document.elementFromPoint(e.clientX, e.clientY));
    }
  };

  ui.init_controls();

}());
