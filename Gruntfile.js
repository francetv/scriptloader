module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bwr: grunt.file.readJSON('bower.json'),

    clean: {
      cov: ['cov.html'],
      dist: ["<%= pkg.name %>.min.js"/*, "<%= pkg.name %>.standalone.min.js"*/],
      build_residues: ["<%= pkg.name %>.js"/*, "<%= pkg.name %>.standalone.js"*/]
    },
    test: {
      dev: ['test/**/testrunner*.html'],
      build: ['test/**/buildtester*.html']
    },
    requirejs: {
/*
      standalone: {
        options: {
          baseUrl: "./src",
          name: "<%= pkg.name %>",
          out: "<%= pkg.name %>.standalone.js",
          paths: {
            'other_module': 'path/to/other_module.min'
          },
          optimize: "none"
        }
      },
*/
      dist: {
        options: {
          baseUrl: "./src",
          name: "<%= pkg.name %>",
          out: "<%= pkg.name %>.js",
/*
          paths: {
            other_module: 'empty:'
          }
*/
          optimize: "none"
        }
      }
    },
    uglify: {
/*
      standalone: {
        files: {
          '<%= pkg.name %>.standalone.min.js': ['<%= pkg.name %>.standalone.js']
        }
      },
*/
      dist: {
        files: {
          '<%= pkg.name %>.min.js': ['<%= pkg.name %>.js']
        }
      }
    },
    'check-coverage': {
      src: ['src/**/*.js'],
      options: {
        minimumCov: 75,
        testRunnerFile: 'test/testrunner.html'
      }
    },
    'check-git-clean': {
      options: {
        ignore: [
          '<%= pkg.name %>.js',
          '<%= pkg.name %>.min.js',
/*
          '<%= pkg.name %>.standalone.js',
          '<%= pkg.name %>.standalone.min.js',
*/
          'cov.html'
        ]
      }
    },
    rename: {
      dev: {
        files: [{
          src: ['<%= pkg.name %>.js'],
          dest: '<%= pkg.name %>.min.js'
        }/*, {
          src: ['<%= pkg.name %>.standalone.js'],
          dest: '<%= pkg.name %>.standalone.min.js'
        }*/]
      }
    },
    watch: {
      dev: {
        files: ['src/**/*.js'],
        tasks: ['build-dev'],
        options: {
          spawn: false,
        },
      },
    }
  });

  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-rename');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadTasks('grunt-tasks');

  grunt.renameTask('mocha_phantomjs', 'test');

  grunt.registerTask('build', ['clean:dist', 'clean:build_residues', 'requirejs', 'uglify', 'clean:build_residues']);
  grunt.registerTask('build-dev', ['clean:dist', 'clean:build_residues', 'requirejs', 'rename:dev', 'clean:build_residues']);

  grunt.registerTask('dev', ['build-dev', 'watch:dev']);

  grunt.registerTask('default', ['test:dev', 'build', 'test:build']);
};