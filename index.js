/*
 * pagespeed-monitor-cli
 * http://github.com/gauntface/pagespeed-monitor-cli
 *
 * Copyright (c) 2014 Google Inc.
 * Licensed under an Apache 2 license.
 */

'use strict';

/**function getURLFromUser() {
	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});
	var index = 0;
	rl.question("What is the URL for the sitemap you'd like to crawl? ", function(sitemapUrl) {
		rl.close();
	});
}

getURLFromUser();**/
var pagespeedMonitor = require('./../pagespeed-monitor');
var fs = require('fs');
var pkg = require( './package.json' );

var argv = require('minimist')(process.argv.slice(2));

var printHelp = function() {
    console.log([
        'pagespeed-monitor-cli',
        pkg.description,
        '',
        'Usage:',
        '    $ pagespeed-monitor-cli <url-to-sitemap>',
        '        -config <relative path to config file>'
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

var configFilePath = argv.config || './config/config.js';

var onResultCb;
var onErrorCb;
var onCompleteCb;
var sitemapUrl;
if(argv.cli) {
    onResultCb = function(url, type, data) {
		console.log('---------------------------------');
		if(data.score < 85) {
			console.log('FAIL');
			console.log('URL: '+url);
			console.log('Score: '+data.score);

			var ruleResults = data.formattedResults.ruleResults;
			console.log('Things to improve:');
			for(var ruleName in ruleResults) {
				var ruleResult = ruleResults[ruleName];
				if(ruleResult.ruleImpact > 0) {
					console.log('    - '+ruleResult.localizedRuleName);
					console.log('      '+ruleResult.ruleImpact);
				}
			}
		} else {
			console.log('PASS');
			console.log('URL: '+url);
			console.log('Score: '+data.score);
		}
		console.log('---------------------------------');
		console.log('');
	};
	onErrorCb = function(err) {
		console.log('There was an error while running the script '+err);
		process.exit();
	};
	onCompleteCb = function() {
		console.log('The run completed successfully');
		process.exit();
	};

	sitemapUrl = argv._[0];

	pagespeedMonitor.on('onResult', onResultCb);

	pagespeedMonitor.on('onError', onErrorCb);

	pagespeedMonitor.on('onCompleted', onCompleteCb);

	pagespeedMonitor.crawlSitemap(sitemapUrl);
} else {
	var dbHelper = require('./db/db-helper.js');
	var config = require(configFilePath);

	sitemapUrl = config.sitemapURL;

	dbHelper.setConfig(config);
	dbHelper.openDb(function(err, connection) {
		onErrorCb = function(err) {
			var msg = 'There was an error while running the script '+err;
			
			console.log('Error: '+err);

			if(connection) {
				connection.end();
			}
			process.exit();
		};

		if(err) {
			onErrorCb(err);
			return;
		}

		onCompleteCb = function() {
			var msg = 'The run completed successfully';

			connection.end();
			process.exit();
		};
		onResultCb = function(url, type, data) {
			connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
			  if (onErrorCb) {
			  	onErrorCb(err);
			  }

			  console.log('The solution is: ', rows[0].solution);
			});

			connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
			  if (onErrorCb) {
			  	onErrorCb(err);
			  }

			  console.log('The solution is: ', rows[0].solution);
			});
		};

		pagespeedMonitor.on('onResult', onResultCb);

		pagespeedMonitor.on('onError', onErrorCb);

		pagespeedMonitor.on('onCompleted', onCompleteCb);

		pagespeedMonitor.crawlSitemap(sitemapUrl);
	});
}