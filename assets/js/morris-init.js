! function(e) {
    "use strict";
    var r = function() {};
    r.prototype.createLineChart = function(e, r, a, t, i, o) {
        Morris.Line({
            element: e,
            data: r,
            xkey: a,
            ykeys: t,
            labels: i,
            hideHover: "auto",
            resize: !0,
            lineColors: o,
            gridLineColor: "rgba(135, 135, 135, 0.1)",
            gridTextColor: "#999"
        })
    }, r.prototype.createAreaChart = function(e, r, a, t, i, o, l, s) {
        Morris.Area({
            element: e,
            pointSize: 3,
            lineWidth: 2,
            data: t,
            xkey: i,
            ykeys: o,
            labels: l,
            resize: !0,
            hideHover: "auto",
            lineColors: s,
            gridLineColor: "rgba(135, 135, 135, 0.1)",
            fillOpacity: .6,
            gridTextColor: "#999"
        })
    }, r.prototype.createBarChart = function(e, r, a, t, i, o) {
        Morris.Bar({
            element: e,
            data: r,
            xkey: a,
            ykeys: t,
            labels: i,
            barSizeRatio: .4,
            resize: !0,
            hideHover: "auto",
            barColors: o,
            gridLineColor: "rgba(135, 135, 135, 0.1)",
            barRadius: [3, 3, 0, 0],
            barOpacity: 1,
            highlightSpeed: 150,
            barRadius: [5, 5, 0, 0],
            gridTextColor: "#999"
        })
    }, r.prototype.createDonutChart = function(e, r, a) {
        Morris.Donut({
            element: e,
            data: r,
            backgroundColor: "#transparent",
            labelColor: "#666",
            resize: !0,
            colors: a
        })
    }, r.prototype.init = function() {
        this.createLineChart("morris-line-example", [{
            y: "2009",
            a: 100,
            b: 90
        }, {
            y: "2010",
            a: 75,
            b: 65
        }, {
            y: "2011",
            a: 50,
            b: 40
        }, {
            y: "2012",
            a: 75,
            b: 65
        }, {
            y: "2013",
            a: 50,
            b: 40
        }, {
            y: "2014",
            a: 75,
            b: 65
        }, {
            y: "2015",
            a: 100,
            b: 90
        }], "y", ["a", "b"], ["Series A", "Series B"], ["#365d6e", "#ddd"]);
        this.createAreaChart("morris-area-example", 0, 0, [{
            y: "2009",
            a: 10,
            b: 20
        }, {
            y: "2010",
            a: 75,
            b: 65
        }, {
            y: "2011",
            a: 50,
            b: 40
        }, {
            y: "2012",
            a: 75,
            b: 65
        }, {
            y: "2013",
            a: 50,
            b: 40
        }, {
            y: "2014",
            a: 75,
            b: 65
        }, {
            y: "2015",
            a: 90,
            b: 60
        }, {
            y: "2016",
            a: 90,
            b: 75
        }], "y", ["a", "b"], ["Series A", "Series B"], ["#365d6e", "#59ceb5"]);
        this.createBarChart("morris-bar-example", [{
            y: "2009",
            a: 100,
            b: 90
        }, {
            y: "2010",
            a: 75,
            b: 65
        }, {
            y: "2011",
            a: 50,
            b: 40
        }, {
            y: "2012",
            a: 75,
            b: 65
        }, {
            y: "2013",
            a: 50,
            b: 40
        }, {
            y: "2014",
            a: 75,
            b: 65
        }, {
            y: "2015",
            a: 100,
            b: 90
        }, {
            y: "2016",
            a: 90,
            b: 75
        }], "y", ["a", "b"], ["Series A", "Series B"], ["#365d6e", "#59ceb5"]);
        this.createDonutChart("morris-donut-example", [{
            label: "Download Sales",
            value: 12
        }, {
            label: "Store Sales",
            value: 30
        }, {
            label: "Online Sales",
            value: 20
        }], ["rgba(211, 218, 232,0.4)", "rgba(89, 206, 181, 1)", "rgba(54, 93, 110, 1)"])
    }, e.MorrisCharts = new r, e.MorrisCharts.Constructor = r
}(window.jQuery),
function(e) {
    "use strict";
    window.jQuery.MorrisCharts.init()
}();