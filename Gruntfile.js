module.exports = function(grunt){
    
    grunt.initConfig({
      concat: {
        js: {
          src: ['assets/js/jquery.jquery.min.js','assets/js/popper.min.js','assets/js/bootstrap.min.js', 'assets/js/modernizr.min.js','assets/js/detect.js','assets/js/fastclick.js','assets/js/jquery.slimscroll.js','assets/js/jquery.blockUI.js','assets/js/waves.js','assets/js/jquery.nicescroll.js','assets/js/jquery.scrollTo.min.js','assets/js/plugins/metro/metroJS.min.js','assets/js/plugins/jvectormap/jquery-jvectormap-2.0.2.min.js','assets/js/plugins/jvectormap/jquery-jvectormap-world-mill-en.js','assets/js/plugins/sparkline-chart/jquery.sparkline.min.js','assets/js/plugins/morris/morris.min.js','assets/js/plugins/raphael/raphael.min.js'],
          dest: 'build/js/scripts.js',  
        },
        css: {
          src: ['assets/css/fonts.css', 'assets/css/style.css', 'assets/css/slick.css'],
          dest: 'build/css/styles.css',
        },
      },
      watch: {
      js: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      css: {
        files: ['assets/css/*.css'],
        tasks: ['concat'],
      },
    },
    // minify js configuration.
      uglify: {
        my_target: {
          files: {
            'build/js/scripts.min.js': ['build/js/scripts.js']
          }
        }
      }
//above this    
    });
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default',['concat','watch']);
}