module.exports = function (gulp, plugins, config) {
  var deleteFolderRecursive = require('../../functions/delete-folder-recursive');
  var dir = require('../../functions/dir')(config);

  return function () {
    deleteFolderRecursive(dir(config.dirs.build));
  }
};