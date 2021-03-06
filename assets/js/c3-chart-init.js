! function(e) {
    "use strict";
    var a = function() {};
    a.prototype.init = function() {
        c3.generate({
            bindto: "#chart",
            data: {
                columns: [
                    ["Desktop", 150, 80, 70, 152, 250, 95],
                    ["Mobile", 200, 130, 90, 240, 130, 220],
                    ["Tablet", 300, 200, 160, 400, 250, 250]
                ],
                type: "bar",
                colors: {
                    Desktop: "#eef0f6",
                    Mobile: "#59ceb5",
                    Tablet: "#365d6e"
                }
            }
        }), c3.generate({
            bindto: "#combine-chart",
            data: {
                columns: [
                    ["GoPros", 30, 20, 50, 40, 60, 50],
                    ["iMacs", 200, 130, 90, 240, 130, 220],
                    ["Tablets", 300, 200, 160, 400, 250, 250],
                    ["iPhones", 200, 130, 90, 240, 130, 220],
                    ["Macbooks", 130, 120, 150, 140, 160, 150]
                ],
                types: {
                    GoPros: "bar",
                    iMac: "bar",
                    Tablets: "spline",
                    iPhones: "line",
                    Macbooks: "bar"
                },
                colors: {
                    GoPros: "#365d6e",
                    iMacs: "#eef0f6",
                    Tablets: "#b9dfc6",
                    iPhones: "#e67a77",
                    Macbooks: "#59ceb5"
                },
                groups: [
                    ["GoPros", "iMacs"]
                ]
            },
            axis: {
                x: {
                    type: "categorised"
                }
            }
        }), c3.generate({
            bindto: "#roated-chart",
            data: {
                columns: [
                    ["Revenue", 30, 200, 100, 400, 150, 250],
                    ["Pageview", 50, 20, 10, 40, 15, 25]
                ],
                types: {
                    Revenue: "bar"
                },
                colors: {
                    Revenue: "#59ceb5",
                    Pageview: "#365d6e"
                }
            },
            axis: {
                rotated: !0,
                x: {
                    type: "categorised"
                }
            }
        }), c3.generate({
            bindto: "#chart-stacked",
            data: {
                columns: [
                    ["Revenue", 130, 120, 150, 140, 160, 150, 130, 120, 150, 140, 160, 150],
                    ["Pageview", 200, 130, 90, 240, 130, 220, 200, 130, 90, 240, 130, 220]
                ],
                types: {
                    Revenue: "area-spline",
                    Pageview: "area-spline"
                },
                colors: {
                    Revenue: "#eef0f6",
                    Pageview: "#59ceb5"
                }
            }
        }), c3.generate({
            bindto: "#donut-chart",
            data: {
                columns: [
                    ["Desktops", 78],
                    ["Smart Phones", 55],
                    ["Mobiles", 40],
                    ["Tablets", 25]
                ],
                type: "donut"
            },
            donut: {
                title: "Candidates",
                titleColor: "#ffffff !important",
                width: 30,
                label: {
                    show: !1
                }
            },
            color: {
                pattern: ["#aaaaaa", "#eef0f6", "#59ceb5", "#365d6e"]
            }
        }), c3.generate({
            bindto: "#pie-chart",
            data: {
                columns: [
                    ["Desktops", 78],
                    ["Smart Phones", 55],
                    ["Mobiles", 40],
                    ["Tablets", 25]
                ],
                type: "pie"
            },
            color: {
                pattern: ["#aaaaaa", "#eef0f6", "#59ceb5", "#365d6e"]
            },
            pie: {
                label: {
                    show: !1
                }
            }
        })
    }, e.ChartC3 = new a, e.ChartC3.Constructor = a
}(window.jQuery),
function(e) {
    "use strict";
    window.jQuery.ChartC3.init()
}();