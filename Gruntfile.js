module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            build: {
                src: 'impetus.js',
                dest: 'impetus.min.js'
            },
            options: {
                banner: '/**\n' +
                    //' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                    ' * <%= pkg.name %> - v<%= pkg.version %>\n' +
                    ' * <%= pkg.homepage %>\n' +
                    ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
                    ' * Licensed <%= pkg.licenses.type %> <<%= pkg.licenses.url %>>\n' +
                    ' */\n'
            }
        },
        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                updateConfigs: ['pkg'],
                commitFiles: ['-a'],
                //push: false,
                pushTo: 'origin'
            }
        }
    
    });
    
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bump');
    
    
    grunt.registerTask('default', ['uglify']);
    
    grunt.registerTask('release', function(bumpOption) {
        var bumpOnlyTask = 'bump-only';
        if (bumpOption) {
            bumpOnlyTask += ':' + bumpOption;
        }
        grunt.task.run(bumpOnlyTask, 'uglify', 'bump-commit');
    });
    
};