module.exports = function (gulp, plugins, config) {
  var bowerFiles = require('main-bower-files');
  var getAdditionalLibraries = require('../../functions/get-additional-libraries');

  var bowerFontTemplates =
      {
        bootstrap: {
          name: "bootstrap",
          directory: "fonts",
          escapeUrl: /glyphicons/
        },
        fontAwesome: {
          name: "components-font-awesome",
          directory: "fonts",
          escapeUrl: /fontawesome/
        }
      };

  function keepOriginal(url) {
    return _.some(config.gulp.additionalBowerFiles.fonts, function (font) {
      return font.escapeUrl.test(url);
    });
  }

  return function () {
    var jsFilter = plugins.filter('**/*.js'),
        cssFilter = plugins.filter('**/*.css'),
        assetsFilter = plugins.filter(['!**/*.js', '!**/*.css', '!**/*.scss']);

    /**
     * Ignore the files defined in the 'main' property of a bower.json library in case we need to use different files from the library (defined in gulp-config.json)
     */
    var bowerLibraries = _(bowerFiles(config.bower).filter(function (file) {
      return !_.some(config.gulp.additionalBowerFiles.js, function (jsfile) {
        return jsfile.ignoreMain === true && file.indexOf(jsfile.name) !== -1;
      });
    }));

    /**
     * Get additional files for libraries that are defined in gulp-config.json
     */
    var bowerAdditional = getAdditionalLibraries(config.gulp.additionalBowerFiles.js);
    var allFiles = _(bowerLibraries).compact().concat(bowerAdditional);

    _.each(allFiles, function (file) {
      _.each(bowerFontTemplates, function (template) {
        if (file.indexOf(template.name) !== -1) {
          config.gulp.additionalBowerFiles.fonts.push(template);
        }
      })
    });

    return gulp.src(allFiles, {base: config.dirs.src.bower})
      .pipe(jsFilter)
      .pipe(plugins.concat('lib.js'))
      .pipe(plugins.if(config.isProduction, plugins.uglify()))
      .pipe(gulp.dest(config.dirs.build.bower))
      .pipe(jsFilter.restore())
      .pipe(cssFilter)
      .pipe(map(function (file, callback) {
        var relativePath = path.dirname(path.relative(path.resolve(config.dirs.src.bower), file.path));
        var contents = file.contents.toString().replace(/url\([^)]*\)/g, function (match) {
          // find the url path, ignore quotes in url string
          var matches = /url\s*\(\s*(('([^']*)')|("([^"]*)")|([^'"]*))\s*\)/.exec(match),
              url = matches[3] || matches[5] || matches[6];
          // Don't modify data, http(s) and protocol agnostic urls
          if (/^data:/.test(url) || /^http(:?s)?:/.test(url) || /^\/\//.test(url) || keepOriginal(url))
            return 'url(' + url + ')';
          return 'url(' + path.join(path.relative(config.dirs.build.bower, config.dirs.build.app), config.dirs.build.bower, relativePath, url) + ')';
        });
        file.contents = new Buffer(contents);

        callback(null, file);
      }))
      .pipe(plugins.concat('lib.css'))
      .pipe(plugins.if(config.isProduction, plugins.minifyCss({keepSpecialComments: '*'})))
      .pipe(gulp.dest(config.dirs.build.css))
      .pipe(cssFilter.restore())
      .pipe(assetsFilter)
      .pipe(gulp.dest(config.dirs.build.bower))
      .pipe(assetsFilter.restore())
      .pipe(plugins.connect.reload());
  }
};