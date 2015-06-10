'use strict';

var chalk = require('chalk');

function LogHelper() {
  var colorMap = {};

  this.getColorForKey = function(key) {
    if (colorMap[key]) {
      return colorMap[key];
    }

    return null;
  };

  this.setColorForKey = function(key, color) {
    colorMap[key] = color;
  };
}

LogHelper.prototype.log = function() {
  var callerFile = getCallerFile();
  var colorKey = this.getLogColor(callerFile);
  for (var i = 0; i < arguments.length; i++) {
    console.log(chalk[colorKey](callerFile) + ': ', arguments[i]);
  }
};

LogHelper.prototype.error = function() {
  var callerFile = getCallerFile();
  var colorKey = this.getLogColor(callerFile);
  for (var i = 0; i < arguments.length; i++) {
    console.log(chalk[colorKey](callerFile) + chalk.bgRed('[Error]') + ': ',
      arguments[i]);
  }
};

LogHelper.prototype.getLogColor = function(callerFile) {
  var colorKey = this.getColorForKey(callerFile);
  if (colorKey === null) {
    var keys = Object.keys(chalk.styles);
    colorKey = keys[Math.floor(Math.random() * keys.length)];
    this.setColorForKey(callerFile, colorKey);
  }

  return colorKey;
};

function getCallerFile() {
  try {
    var err = new Error();
    var callerfile;
    var currentfile;

    Error.prepareStackTrace = function(err, stack) { return stack; };

    currentfile = err.stack.shift().getFileName();

    while (err.stack.length) {
      callerfile = err.stack.shift().getFileName();

      if (currentfile !== callerfile) {
        var parts = callerfile.split('/');
        return parts[parts.length - 1];
      }
    }
  } catch (err) {}
  return undefined;
}

module.exports = new LogHelper();
