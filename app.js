#!/usr/bin/env node
'use strict';
// Adapted from cli.js in gpagespeed

var argv = require('minimist')(process.argv.slice(2));

var pkg = require('./package.json');
var LogHelper = require('./helper/LogHelper.js');
var TestRunController = require('./controller/TestRunController');

var printHelp = function() {
  LogHelper.log([
    'webperf-monitor',
        pkg.description,
        '',
        'Usage:',
        '    $ webperf-monitor -c <path-to-config>'
    ].join('\n'));
};

if (argv.v || argv.version) {
  LogHelper.log(pkg.version);
  return;
}

if (argv.h || argv.help) {
  printHelp();
  return;
}

var configFilePath = './config/config.js';

if (argv.c || argv.config) {
  configFilePath = argv.c || argv.config;
}

if (configFilePath.indexOf('.') === 0) {
  configFilePath = configFilePath.substring(1);
  configFilePath = __dirname + configFilePath;
}

LogHelper.log('Looking for config file at ' + configFilePath);

var config;
try {
  config = require(configFilePath);
} catch (exception) {}

if (!config) {
  LogHelper.error('No config file could be found.');
  process.exit();
  return;
}

var testRunController = new TestRunController(configFilePath, config);
testRunController.startNewRun();
