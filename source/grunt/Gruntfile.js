module.exports = function(grunt) {
	
	grunt.log.write('Beginning build process...');
	
	// Configure Grunt
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			options: {
				force: true
			},
			release: ['../../www/']
		},
		copy: {
			main: {
				options: {},
				files: [
					// Config XML
					{
						expand: true,
						cwd: '../../',
						src: ['*.xml'],
						dest: '../../www/'
					},
					// CSS
					{
						expand: true,
						cwd: '../assets/css',
						src: ['**'],
						dest: '../../www/css',
						filter: function(filepath) {
							return filepath.match(/\.css|\.min.css/);
						}
					},
					// Images
					{
						expand: true,
						cwd: '../assets/img',
						src: ['**'],
						dest: '../../www/img',
						filter: function(filepath) {
							return filepath.match(/\.jpg|\.png|\.gif|\.svg/);
						}
					},
					// JS
					{
						expand: true,
						cwd: '../assets/js',
						src: ['**'],
						dest: '../../www/js',
						filter: function(filepath) {
							return filepath.match(/\.js|\.min.js/);
						}
					}
				]
			}
		},
		uglify: {
			core: {
				options: {
					mangle: true,
					compress: true
				},
				files: [{
					expand: true,
					cwd: '../../www/js/common',
					src: '**/*.js',
					dest: '../../www/js/common'
				}]
			},
			components: {
				options: {
					mangle: false
				},
				files: {
					'../../www/js/components/async.js': ['../assets/components/async/lib/async.js'],
					'../../www/js/components/backbone.js': ['../assets/components/backbone/backbone.js'],
					'../../www/js/components/jquery.js': ['../assets/components/jquery/dist/jquery.js'],
					'../../www/js/components/moment.js': ['../assets/components/moment/moment.js'],
					'../../www/js/components/underscore.js': ['../assets/components/underscore/underscore.js'],
					'../../www/js/components/velocity.js': ['../assets/components/velocity/jquery.velocity.js']
				}
			}
		},
		jade: {
			compile: {
				options: {
					data: {
						debug: false
					}
				},
				files: {
					'../../www/index.html': ['../assets/views/app.jade']
				}
			}
		},
		less: {
			development: {
				options: {
					paths: ['../source/public/css'],
					compress: true
				},
				files: {
					'../../www/css/app.css': '../assets/css/app.less'
				}
			}
		},
		relativeRoot: {
			www: {
				options: {
					root: '../../www/'
				},
				files: [{
					expand: true,
					cwd: '../../www/',
					src: ['**'],
					dest: '../../www/',
					filter: function(filepath) {
						return filepath.match(/.html|.min.css/).length;
					}
				}]
			}
		},
		watch: {
			scripts: {
				options: {},
				files: [
					'Gruntfile.js',
					
					'../../config.xml',
					'../assets/**/*.jade',
					'../assets/**/*.less',
					'../assets/**/*.js'
				],
				tasks: ['copy', 'uglify:core', 'jade', 'less', 'relativeRoot'] // Does not include 'watch' which would spawn additional grunt processes
			}
		}
	});
	
	// Load modules to run
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jade');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-relative-root');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	// Set tasks to run
	grunt.registerTask('nuclear', ['clean']);
	grunt.registerTask('components', ['uglify:components']);
	grunt.registerTask('core', ['copy', 'uglify:core', 'jade', 'less', 'relativeRoot', 'watch']);
	grunt.registerTask('all', ['clean', 'uglify:components', 'copy', 'uglify:core', 'jade', 'less', 'relativeRoot']);
	
};
