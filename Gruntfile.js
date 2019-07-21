module.exports = function(grunt){
    
    grunt.initConfig({
      concat: {
        js: {
          src: ['assets/js/jquery.js', 'assets/js/pace.js', 'assets/js/wow.min.js', 'assets/js/slick.min.js', 'assets/js/typed.min.js','assets/js/main.js'],
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
    
//above this    
    });
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default',['concat','watch']);
}