/*
 * grunt-escaped-seo
 * https://github.com/hazart/grunt-escaped-seo
 *
 * Copyright (c) 2013 Alex Koch
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    watch: {
      coffee: {
        files: ['src/{,**/}*.coffee'],
        tasks: ['coffee'],
        options: {
          spawn: false
        }
      }
    },

    coffee: {
      dev: {
        expand: true,
        cwd: 'src',
        src: ['**/*.coffee'],
        dest: 'tasks',
        ext: '.js',
        options: {
          runtime: 'inline',
        }
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    // Configuration to be run (and then tested).
    'escaped-seo': {
      dist: {
        options: {
          domain: 'http://test.pr0d.fr',  
          server: 'http://localhost:9001'
        },
      },
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-coffee');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'escaped-seo']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['coffee', 'watch:coffee']);

};
