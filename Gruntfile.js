module.exports = function (grunt) {
    grunt.initConfig({
        browserify: {
            dist: {
                src: ['src/main.js'],
                dest: 'dist/reactive-property.js',
                options: {
                    browserifyOptions: {
                        standalone: "reactiveProperty"
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('build', ['browserify:dist']);
};