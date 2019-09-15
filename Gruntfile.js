module.exports = function(grunt){
    
    grunt.initConfig({
      concat: {
        js: {
          src: ['assets/js/modernizr.min.js','assets/js/detect.js','assets/js/fastclick.js','assets/js/jquery.slimscroll.js','assets/js/jquery.blockUI.js','assets/js/waves.js','assets/js/jquery.nicescroll.js','assets/js/jquery.scrollTo.min.js','assets/js/plugins/metro/metroJS.min.js','assets/js/plugins/jvectormap/jquery-jvectormap-2.0.2.min.js','assets/js/plugins/jvectormap/jquery-jvectormap-world-mill-en.js','assets/js/plugins/sparkline-chart/jquery.sparkline.min.js','assets/js/plugins/morris/morris.min.js','assets/js/plugins/raphael/raphael.min.js','assets/js/svg-change-colour.js','assets/js/dashboard.js','assets/js/nightowl-app.js'],
          dest: 'build/js/scripts.js',  
        },
        //calendar js
        caljs: {
          src: ['assets/js/plugins/jquery-ui/jquery-ui.min.js','assets/js/moment.js','assets/js/plugins/fullcalendar/fullcalendar.min.js','assets/js/calendar-init.js'],
          dest: 'build/js/calendar-combined.js',  
        },
         //Ranger Slider js
        powerange: {
          src: ['assets/js/plugins/powerange/powerange.js','assets/js/rangerslider-init.js'],
          dest: 'build/js/powerange-combined.js',  
        },
        //nightOwl App js
        nightOwlApp: {
          src: ['assets/js/nightowl-app.js'],
          dest: 'build/js/nightowl-app.js',  
        },
        //rating js
        ratingjs: {
          src: ['assets/js/plugins/bootstrap-rating/bootstrap-rating.js','assets/js/plugins/emotion-rating/emotion-ratings.js'],
          dest: 'build/js/rating-combined.js',  
        },
        //sweet alert js
        sweetalertjs: {
          src: ['assets/js/plugins/sweet-alert/sweetalert.min.js','assets/js/plugins/sweet-alert/sweetalert-init.js'],
          dest: 'build/js/sweetalert-combined.js',  
        },
        //form advanced js
        formadvancedjs: {
          src: ['assets/js/plugins/timepicker/moment.js','assets/js/plugins/timepicker/tempusdominus-bootstrap-4.js','assets/js/plugins/timepicker/bootstrap-material-datetimepicker.js','assets/js/plugins/colorpicker/jquery-asColor.js','assets/js/plugins/colorpicker/jquery-asGradient.js','assets/js/plugins/colorpicker/jquery-asColorPicker.min.js','assets/js/plugins/select2/select2.min.js','assets/js/plugins/bootstrap-colorpicker/js/bootstrap-colorpicker.min.js','assets/js/plugins/bootstrap-datepicker/js/bootstrap-datepicker.min.js','assets/js/plugins/bootstrap-maxlength/bootstrap-maxlength.min.js','assets/js/plugins/bootstrap-touchspin/js/jquery.bootstrap-touchspin.min.js','assets/js/plugins/bootstrap-inputmask/bootstrap-inputmask.min.js','assets/js/plugins/dropzone/dist/dropzone.js','assets/js/form-advanced.js'],
          dest: 'build/js/form-advanced-combined.js',  
        },
        //form validation js
        formvaljs: {
          src: ['assets/js/plugins/parsleyjs/parsley.min.js','assets/js/form-validation-init.js'],
          dest: 'build/js/form-validation-combined.js',  
        },
        //summernote js
        summernote: {
          src: ['assets/js/plugins/summernote/summernote-bs4.js','assets/js/form-summernote-init.js'],
          dest: 'build/js/summernote-combined.js',  
        },
        //charts - chartist js
        chartistjs: {
          src: ['assets/js/plugins/chartist/chartist.min.js','assets/js/plugins/chartist/chartist-plugin-tooltip.min.js'],
          dest: 'build/js/chartist-combined.js',  
        },
        //jvectormap - jvectormap js
        jvectormap: {
          src: ['assets/js/plugins/jvectormap/jquery-jvectormap-2.0.2.min.js','assets/js/plugins/jvectormap/jquery-jvectormap-world-mill-en.js','assets/js/plugins/jvectormap/gdp-data.js','assets/js/plugins/jvectormap/jquery-jvectormap-ca-lcc.js','assets/js/plugins/jvectormap/jquery-jvectormap-us-aea-en.js','assets/js/plugins/jvectormap/jquery-jvectormap-uk-mill-en.js','assets/js/plugins/jvectormap/jquery-jvectormap-us-il-chicago-mill-en.js','assets/js/jvectormap-init.js'],
          dest: 'build/js/jvectormap-combined.js',  
        },
        //datatable page js
        datatablejs: {
          src: ['assets/js/plugins/datatables/jquery.dataTables.min.js','assets/js/plugins/datatables/dataTables.bootstrap4.min.js','assets/js/plugins/datatables/dataTables.buttons.min.js','assets/js/plugins/datatables/buttons.bootstrap4.min.js','assets/js/plugins/datatables/jszip.min.js','assets/js/plugins/datatables/pdfmake.min.js','assets/js/plugins/datatables/vfs_fonts.js','assets/js/plugins/datatables/buttons.html5.min.js','assets/js/plugins/datatables/buttons.print.min.js','assets/js/plugins/datatables/buttons.colVis.min.js','assets/js/plugins/datatables/dataTables.responsive.min.js','assets/js/plugins/datatables/responsive.bootstrap4.min.js'],
          dest: 'build/js/datatables-combined.js',  
        },
        //rwdtable js
        rwdtablejs: {
          src: ['assets/js/plugins/RWD-Table-Patterns/rwd-table.min.js','assets/js/rwdtable-init.js'],
          dest: 'build/js/rwd-table.js',  
        },
        //edittablejs js
        edittablejs: {
          src: ['assets/js/plugins/tiny-editable/mindmup-editabletable.js','assets/js/plugins/tiny-editable/numeric-input-example.js','assets/js/plugins/tabledit/jquery.tabledit.js','assets/js/edit-table-init.js'],
          dest: 'build/js/edittable-table.js',  
        },
        //flot chart js
        flotjs: {
          src: ['assets/js/plugins/flot-chart/jquery.flot.min.js','assets/js/plugins/flot-chart/','assets/js/plugins/flot-chart/jquery.flot.time.js','assets/js/plugins/flot-chart/jquery.flot.tooltip.min.js','assets/js/plugins/flot-chart/jquery.flot.resize.js','assets/js/plugins/flot-chart/jquery.flot.pie.js','assets/js/plugins/flot-chart/jquery.flot.selection.js','assets/js/plugins/flot-chart/jquery.flot.stack.js','assets/js/plugins/flot-chart/curvedLines.js','assets/js/plugins/flot-chart/jquery.flot.crosshair.js',],
          dest: 'build/js/flot-chart-combined.js',  
        },
        //c3 chart js
        cthreejs: {
          src: ['assets/js/plugins/d3/d3.min.js','assets/js/plugins/c3/c3.min.js'],
          dest: 'build/js/c3-chart-combined.js',  
        },
        //chart js
        chartjs: {
          src: ['assets/js/plugins/chart-js/chart.min.js'],
          dest: 'build/js/chart-js-combined.js',  
        },
        //jquery know js
        jknobjs: {
          src: ['assets/js/plugins/jquery-knob/excanvas.js','assets/js/plugins/jquery-knob/jquery.knob.js'],
          dest: 'build/js/jquery-knob-combined.js',  
        },
        css: {
          src: ['assets/css/normalize.css', 'assets/css/icons.css','assets/css/plugins/sweet-alert/sweetalert.min.css' ,'assets/css/plugins/metro/MetroJS.min.css', 'assets/css/plugins/morris/morris.css','assets/css/plugins/c3/c3.min.css','assets/css/plugins/jvectormap/jquery-jvectormap-2.0.2.css','assets/css/plugins/waves/waves.min.css','assets/css/plugins/summernotes/summernote-bs4.css','assets/css/plugins/chartist/chartist.css','assets/css/plugins/RWD-Table-Patterns/rwd-table.min.css','assets/css/bootstrap.min.css','assets/css/plugins/fullcalendar/fullcalendar.min.css','assets/css/plugins/animate/animate.css','assets/css/plugins/powerange/powerange.css', 'assets/css/plugins/bootstrap-rating/bootstrap-rating.css','assets/css/style.css','assets/css/top-nav.css', 'assets/css/chat.css','assets/css/preloader.css', 'assets/css/utilities.css', 'assets/css/tables.css','assets/css/stars.css', 'assets/css/responsive.css', 'assets/css/modal.css','assets/css/print.css'],
          dest: 'build/css/styles.css',
        },
        formadvancedcss:{
          src:['assets/css/plugins/timepicker/tempusdominus-bootstrap-4.css','assets/css/plugins/timepicker/bootstrap-material-datetimepicker.css','assets/css/plugins/colorpicker/asColorPicker.min.css','assets/css/plugins/select2/select2.min.css','assets/css/plugins/bootstrap-colorpicker/bootstrap-colorpicker.min.css','assets/css/plugins/bootstrap-datepicker/bootstrap-datepicker.min.css','assets/css/plugins/bootstrap-touchspin/jquery.bootstrap-touchspin.min.css','assets/css/plugins/dropzone/dist/dropzone.css'],
           dest: 'build/css/form-advanced.css',
        },
        datatablescss:{
          src:['assets/css/plugins/datatables/dataTables.bootstrap4.min.css','assets/css/plugins/datatables/buttons.bootstrap4.min.css','assets/css/plugins/datatables/responsive.bootstrap4.min.css'],
           dest: 'build/css/datatables.css',
        },
      },
      watch: {
      js: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      caljs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      powerange: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      nightOwlApp: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      ratingjs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      sweetalertjs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      formadvancedjs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      chartistjs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      jvectormap: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      datatablejs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      edittablejs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      flotjs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      cthreejs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      chartjs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      jknobjs: {
        files: ['assets/js/*.js'],
        tasks: ['concat'],
      },
      css: {
        files: ['assets/css/*.css'],
        tasks: ['concat'],
      },
      formadvancedcss: {
        files: ['assets/css/*.css'],
        tasks: ['concat'],
      },
      datatablecss: {
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
            'build/js/scripts.min.js': ['build/js/scripts.js'],
            'build/js/calendar-combined.min.js': ['build/js/calendar-combined.js'],
            'build/js/nightowl-app.min.js': ['build/js/nightowl-app.js'],
            'build/js/powerange-combined.min.js': ['build/js/powerange-combined.js'],
            'build/js/rating-combined.min.js': ['build/js/rating-combined.js'],
            'build/js/sweetalert-combined.min.js': ['build/js/sweetalert-combined.js'],
            'build/js/form-advanced-combined.min.js': ['build/js/form-advanced-combined.js'],
            'build/js/form-validation-combined.min.js': ['build/js/form-validation-combined.js'],
            'build/js/summernote-combined.min.js': ['build/js/summernote-combined.js'],
            'build/js/chartist-combined.min.js': ['build/js/chartist-combined.js'],
            'build/js/jvectormap-combined.min.js': ['build/js/jvectormap-combined.js'],
            'build/js/datatables-combined.min.js': ['build/js/datatables-combined.js'],
            'build/js/rwd-table.min.js': ['build/js/rwd-table.js'],
            'build/js/edittable-table.min.js': ['build/js/edittable-table.js'],
            'build/js/flot-chart-combined.min.js': ['build/js/flot-chart-combined.js'],
            'build/js/c3-chart-combined.min.js': ['build/js/c3-chart-combined.js'],
            'build/js/chart-js-combined.min.js': ['build/js/chart-js-combined.js'],
            'build/js/jquery-knob-combined.min.js': ['build/js/jquery-knob-combined.js'],
          }
        }
      },
    // minify css configuration. - grunt cssmin
    cssmin: {
      minifystyles: {
        files: [{
          expand: true,
          cwd: 'build/css',
          src: ['styles.css','form-advanced.css','datatables.css', '!*.min.css'],
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
    grunt.registerTask('default',['concat','uglify','cssmin', 'watch']); //, 'watch'
}