! function(e) {
    "use strict";
    var a = function() {};
    a.prototype.createAreaChart = function(e, a, r, o, i, t, l, n) {
        Morris.Area({
            element: e,
            pointSize: 0,
            lineWidth: 0,
            data: o,
            xkey: i,
            ykeys: t,
            labels: l,
            resize: !0,
            gridLineColor: "#eee",
            hideHover: "auto",
            lineColors: n,
            fillOpacity: .9,
            behaveLikeLine: !0
        })
    }, a.prototype.createDonutChart = function(e, a, r) {
        Morris.Donut({
            element: e,
            data: a,
            resize: !0,
            colors: r,
            labelColor: "#666",
            backgroundColor: "transparent",
            fillOpacity: .1,
            formatter: function(e) {
                return e + "%"
            }
        })
    }, a.prototype.createLineChart = function(e, a, r, o, i, t) {
        Morris.Line({
            element: e,
            data: a,
            xkey: r,
            ykeys: o,
            labels: i,
            hideHover: "auto",
            gridLineColor: "#eee",
            resize: !0,
            lineColors: t
        })
    }, e("#world-map-markers").vectorMap({
        map: "world_mill_en",
        scaleColors: ["rgba(255, 255, 255,0.55)", "rgba(255, 255, 255,0.55)"],
        normalizeFunction: "polynomial",
        hoverOpacity: .7,
        hoverColor: !1,
        regionStyle: {
            initial: {
                fill: "rgba(43, 58, 74, 0.2)"
            }
        },
        markerStyle: {
            initial: {
                r: 4,
                fill: "#00c292",
                "fill-opacity": .9,
                stroke: "#fff",
                "stroke-width": 5,
                "stroke-opacity": .4
            },
            hover: {
                stroke: "#fff",
                "fill-opacity": 1,
                "stroke-width": 2
            }
        },
        backgroundColor: "transparent",
        markers: [{
            latLng: [61.52, 105.31],
            name: "Russia"
        }, {
            latLng: [-25.27, 133.77],
            name: "Australia"
        }, {
            latLng: [20.59, 78.96],
            name: "India"
        }, {
            latLng: [39.52, -87.12],
            name: "Brazil"
        }],
        series: {
            regions: [{
                values: {
                    US: "rgba(43, 58, 74, 0.3)",
                    AU: "rgba(43, 58, 74, 0.3)",
                    IN: "rgba(43, 58, 74, 0.3)",
                    RU: "rgba(43, 58, 74, 0.3)"
                },
                attribute: "fill"
            }]
        }
    }), e(".linechart").sparkline([1, 4, 3, 7, 6, 4, 8, 9, 6, 8, 12], {
        type: "line",
        width: "100",
        height: "38",
        lineColor: "#547d8f",
        fillColor: "rgba(110, 255, 235,0.55)",
        lineWidth: 2,
        minSpotColor: "#aab6a2",
        maxSpotColor: "#aab6a2"
    }), e(".linechart-2").sparkline([1, 4, 3, 7, 6, 4, 12, 9, 6, 3, 2], {
        type: "line",
        width: "100",
        height: "38",
        lineColor: "#547d8f",
        fillColor: "rgba(110, 255, 235,0.55)",
        lineWidth: 2,
        minSpotColor: "#aab6a2",
        maxSpotColor: "#aab6a2"
    }), e(".linechart-3").sparkline([1, 6, 10, 3, 6, 8, 1, 5, 2, 7, 4], {
        type: "line",
        width: "100",
        height: "38",
        lineColor: "#547d8f",
        fillColor: "rgba(110, 255, 235,0.55)",
        lineWidth: 2,
        minSpotColor: "#aab6a2",
        maxSpotColor: "#aab6a2"
    }), e(".live-tile, .flip-list").not(".exclude").liveTile(), e(".boxscroll").niceScroll({
        cursorborder: "",
        cursorcolor: "#314e5f",
        boxzoom: !0
    }), a.prototype.init = function() {
        this.createAreaChart("morris-area-chart", 0, 0, [{
            y: "2007",
            a: 0,
            b: 0,
            c: 0
        }, {
            y: "2008",
            a: 150,
            b: 45,
            c: 15
        }, {
            y: "2009",
            a: 60,
            b: 150,
            c: 195
        }, {
            y: "2010",
            a: 180,
            b: 36,
            c: 21
        }, {
            y: "2011",
            a: 90,
            b: 60,
            c: 360
        }, {
            y: "2012",
            a: 75,
            b: 240,
            c: 120
        }, {
            y: "2013",
            a: 30,
            b: 30,
            c: 30
        }], "y", ["a", "b", "c"], ["Series A", "Series B", "Series C"], ["#ec536c", "#5b6be8", "#59ceb5"]);
        this.createDonutChart("morris-donut-example", [{
            label: "Margin",
            value: 20
        }, {
            label: "Profit",
            value: 30
        }, {
            label: "Lost",
            value: 10
        }], ["rgba(211, 218, 232,0.8)", "rgba(64, 164, 241,0.8)", "rgba(236, 83, 108,0.8)"]);
        this.createLineChart("multi-line-chart", [{
            y: "2012",
            a: 0,
            b: 0
        }, {
            y: "2013",
            a: 50,
            b: 30
        }, {
            y: "2014",
            a: 50,
            b: 30
        }, {
            y: "2015",
            a: 120,
            b: 100
        }, {
            y: "2016",
            a: 60,
            b: 40
        }, {
            y: "2017",
            a: 140,
            b: 120
        }, {
            y: "2018",
            a: 180,
            b: 200
        }], "y", ["a", "b"], ["Dom", "Int"], ["#59ceb5", "#ec536c"])
    }, e.Dashboard = new a, e.Dashboard.Constructor = a
}(window.jQuery),
function(e) {
    "use strict";
    window.jQuery.Dashboard.init()
}();