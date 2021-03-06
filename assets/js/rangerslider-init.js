$(document).ready(function() {
    var e = document.querySelector(".js-step"),
        t = (new Powerange(e, {
            start: 50,
            step: 10
        }), document.querySelector(".js-min-max-start")),
        a = (new Powerange(t, {
            min: 16,
            max: 256,
            start: 128
        }), document.querySelector(".js-callback"));
    new Powerange(a, {
        callback: function() {
            document.getElementById("js-display-callback").innerHTML = a.value
        },
        start: 88
    });
    var n = document.querySelector(".js-hiderange"),
        r = (new Powerange(n, {
            hideRange: !0,
            start: 70
        }), document.querySelector(".js-vertical"));
    new Powerange(r, {
        start: 80,
        vertical: !0
    })
});