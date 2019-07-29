var nightOwlApp = function() {
    "use strict";
    var e = $(window),
        n = $("body"),
        t = $(document),
        l = ($(".body-content"), $("#wrapper"), $(".slimscroll-noti")),
        o = $("#status"),
        c = $("#preloader"),
        u = $("#mobileToggle"),
        i = $("#btn-fullscreen"),
        a = $(".navigation-menu>li"),
        r = $(".navigation-menu li.has-submenu a[href='#']"),
        s = $(".navigation-menu a"),
        d = function(e) {
            o.fadeOut(), c.delay(350).fadeOut("slow"), n.delay(350).css({
                overflow: "visible"
            })
        },
        m = function(e) {
            $('[data-toggle="tooltip"]').tooltip(), $('[data-toggle="popover"]').popover(), l.slimscroll({
                height: "230px",
                position: "right",
                size: "6px",
                color: "#59ceb5",
                wheelStep: 10
            }), u.on("click", function(e) {
                return $(this).toggleClass("open"), $("#navigation").slideToggle(400), !1
            }), a.slice(-1).addClass("last-elements"), r.on("click", function(e) {
                $(window).width() < 992 && (e.preventDefault(), $(this).parent("li").toggleClass("open").find(".submenu:first").toggleClass("open"))
            }), s.each(function() {
                var e = window.location.href.split(/[?#]/)[0];
                this.href == e && ($(this).parent().addClass("active"), $(this).parent().parent().parent().addClass("active"), $(this).parent().parent().parent().parent().parent().addClass("active"))
            }), i.on("click", function(e) {
                return e.preventDefault(), document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement ? document.cancelFullScreen ? document.cancelFullScreen() : document.mozCancelFullScreen ? document.mozCancelFullScreen() : document.webkitCancelFullScreen && document.webkitCancelFullScreen() : document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen() : document.documentElement.mozRequestFullScreen ? document.documentElement.mozRequestFullScreen() : document.documentElement.webkitRequestFullscreen && document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT), !1
            })
        };
    return {
        init: function() {
            t.ready(m), e.on("load", d)
        }
    }
}();
! function(e) {
    "use strict";
    nightOwlApp.init()
}(window.jQuery);