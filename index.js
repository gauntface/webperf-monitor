/*
 * pagespeed-monitor-cli
 * http://github.com/gauntface/pagespeed-monitor-cli
 *
 * Copyright (c) 2014 Google Inc.
 * Licensed under an Apache 2 license.
 */

'use strict';
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
	if(!fs.existsSync(customConfigPathFile)) {
		fs.mkdirSync(customConfigPathFile);
	}

    fs.writeFileSync(customConfigPathFile+customConfigFileName, argv.config);
	configFilePath = argv.c || argv.config;
} else {
	if(fs.existsSync(customConfigPathFile+customConfigFileName)) {
		configFilePath = fs.readFileSync(customConfigPathFile+customConfigFileName);
	}
}

if(configFilePath.indexOf('.') == 0) {
	configFilePath = configFilePath.substring(1);
	configFilePath = __dirname + configFilePath;
}

console.log('Looking for config file at '+configFilePath);

var config;
try {
	config = require(configFilePath);
} catch(exception) {}

if(!config) {
	console.error('No config file could be found.');
	process.exit();
	return;
} else {
	GLOBAL.configFile = configFilePath;
}

var PSILib = require('webperf-lib-psi');
var resultsModel = require('./model/psiresultsmodel.js');
var cronRunModel = require('./model/cronrunmodel.js');

startNewRun(config.sitemapURL);

function startNewRun(sitemapUrl) {
	cronRunModel.addNewRunEntry()
		.then(function(result){
			var runId = result;
			console.log('Added new run ['+runId+']');
			performCrawl(runId, sitemapUrl);
		}).catch(function(err) {
			console.log('webperf-monitor startNewRun() Error: '+err);
			process.exit();
  		});
}

function performCrawl(runId, sitemapUrl) {
	var onErrorCb = function(err) {
		var msg = 'There was an error while running the script: '+err;

		cronRunModel.endRunWithError(runId, msg)
			.then(function(){
				console.log('Run finished with an error: '+err);
				process.exit();
			}).catch(function(err) {
				console.log('webperf-monitor performCrawl() Error: '+err);
				process.exit();
	  		});
	};
	var onCompleteCb = function() {
		var msg = 'Run completed successfully';

		cronRunModel.endRunSuccessfully(runId, msg)
			.then(function(){
				console.log('Run finished successfully');
				process.exit();
			}).catch(function(err) {
				console.log('webperf-monitor performCrawl() Error: '+err);
				process.exit();
	  		});
	};
	var onResultCb = function(url, type, data) {
		console.log('onResult: '+url);
		if(type !== 'psi') {
			// This is in case we end up supporting
			// something other than pagespeed insights
			// But aren't quite handling it yet
			return;
		}

		resultsModel.addResult(runId, url, data)
			.then(function(){
			}).catch(function(err) {
				// What can we do here? I don't believe we
				// can halt execution apart from process.exit

				console.log('webperf-monitor performCrawl() Error: '+err);
	  		});
	};

	PSILib.on('onResult', onResultCb);

	PSILib.on('onError', onErrorCb);

	PSILib.on('onCompleted', onCompleteCb);

	PSILib.crawlSitemap(sitemapUrl);
}