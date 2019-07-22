module.exports = function(grunt){
    
    grunt.initConfig({
      concat: {
        js: {
          src: ['assets/js/modernizr.min.js','assets/js/detect.js','assets/js/fastclick.js','assets/js/jquery.slimscroll.js','assets/js/jquery.blockUI.js','assets/js/waves.js','assets/js/jquery.nicescroll.js','assets/js/jquery.scrollTo.min.js','assets/js/plugins/metro/metroJS.min.js','assets/js/plugins/jvectormap/jquery-jvectormap-2.0.2.min.js','assets/js/plugins/jvectormap/jquery-jvectormap-world-mill-en.js','assets/js/plugins/sparkline-chart/jquery.sparkline.min.js','assets/js/plugins/morris/morris.min.js','assets/js/plugins/raphael/raphael.min.js'],
          dest: 'build/js/scripts.js',  
        },
        css: {
          src: ['assets/css/normalize.css', 'assets/css/icons.css', 'assets/css/plugins/metro/MetroJS.min.css', 'assets/css/plugins/morris/morris.css', 'assets/css/plugins/jvectormap/jquery-jvectormap-2.0.2.css','assets/css/bootstrap.min.css','assets/css/plugins/animate/animate.css','assets/css/style.css','assets/css/top-nav.css', 'assets/css/chat.css','assets/css/preloader.css', 'assets/css/print.css'],
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
      minjs: {
        files: ['build/js/scripts.js'],
        tasks: ['uglify'],
      },
      mincss: {
        files: ['build/css/styles.css'],
        tasks: ['cssmin'],
      },
    },
    // minify js configuration. - grunt uglify
      uglify: {
        minifyscripts: {
          files: {
            'build/js/scripts.min.js': ['build/js/scripts.js']
          }
        }
      },
    // minify css configuration. - grunt cssmin
    cssmin: {
      minifystyles: {
        files: [{
          expand: true,
          cwd: 'build/css',
          src: ['styles.css', '!*.min.css'],
          dest: 'build/css',
          ext: '.min.css'
        }]
      }
    }
//above this    
    });
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default',['concat','uglify','cssmin', 'watch']);
}