#!/usr/bin/env node
'use strict';
// Adapted from cli.js in gpagespeed

var fs = require('fs');
var pkg = require( './package.json' );

var argv = require('minimist')(process.argv.slice(2));

var printHelp = function() {
    console.log([
        'webperf-monitor',
        pkg.description,
        '',
        'Usage:',
        '    $ webperf-monitor -c <path-to-config>'
    ].join('\n'));
};

if(argv.v || argv.version) {
    console.log(pkg.version);
    return;
}

if(argv.h || argv.help) {
    printHelp();
    return;
}

var configFilePath = './config/config.js'
var customConfigPathFile = './.config/';
var customConfigFileName = 'settings';

if(argv.c || argv.config) {
    configFilePath = argv.c || argv.config;
}

if(configFilePath.indexOf('.') == 0) {
	configFilePath = configFilePath.substring(1);
	configFilePath = __dirname + configFilePath;
}

console.log('Looking for config file at '+configFilePath);

var webperfmonitor = require('./index');

new webperfmonitor(configFilePath);