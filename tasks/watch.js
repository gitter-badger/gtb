module.exports = function (gulp, plugins, config) {
  var getDir = require('../functions/get-dir');
  var notifier = require('gulp-notify/node_modules/node-notifier');
  var con = require('../functions/console');

  var processes = {
    css: require('../tasks/process/process-css')(gulp, plugins, config),
    js: require('../tasks/process/process-js')(gulp, plugins, config),
    html: require('../tasks/process/process-html')(gulp, plugins, config)
  };

  function watcher(fileTypes, directory, process) {
    plugins.watch(getDir.files(fileTypes, directory), function () {
      process();
    });
  }

  return function () {
    con.hint('Watching files for changes ...');

    watcher(['html', 'jade'], 'root', processes.html);
    watcher(['scss', 'sass', 'css'], 'css', processes.css);
    watcher(['coffee', 'js'], 'js', processes.js);
  }
};