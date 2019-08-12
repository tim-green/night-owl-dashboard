$(function() {
    var e = $(".placeholder");
    $("#summernote").summernote({
        height: 300,
        codemirror: {
            mode: "text/html",
            htmlMode: !0,
            lineNumbers: !0,
            theme: "monokai"
        },
        callbacks: {
            onInit: function() {
                e.show()
            }
        }
    })
});