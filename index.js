/*
 * pagespeed-monitor-cli
 * http://github.com/gauntface/pagespeed-monitor-cli
 *
 * Copyright (c) 2014 Google Inc.
 * Licensed under an Apache 2 license.
 */

'use strict';

var pagespeedMonitor = require('./../pagespeed-monitor');
var resultsModel = require('./model/psiresultsmodel.js');
var fs = require('fs');
var pkg = require( './package.json' );
var dbHelper = require('./db/db-helper.js');

var argv = require('minimist')(process.argv.slice(2));

var printHelp = function() {
    console.log([
        'pagespeed-monitor-cli',
        pkg.description,
        '',
        'Usage:',
        '    $ pagespeed-monitor-cli <url-to-sitemap>'
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

var config = require('./config/config.js');

var sitemapUrl = config.sitemapURL;

dbHelper.setConfig(config);
dbHelper.openDb(function(err, dbConnection) {
	if(err) {
		console.log('Unable to establish database connection: '+err);
		return;
	}

	startNewRun(sitemapUrl, dbConnection);
});

function startNewRun(sitemapUrl, dbConnection) {
	var params = {
		status: 'pending',
		message: ''
	};

	dbConnection.query('INSERT INTO runs SET ?, start_time=(now())', params,
		function(err, result) {
			dbConnection.destroy();

            if (err) {
                errorCb(err);
                return;
            }

            var runId = result.insertId;
            performCrawl(runId, sitemapUrl);
		});
}

function performCrawl(runId, sitemapUrl) {
	var onErrorCb = function(err) {
		console.log('onErrorCb');
		var msg = 'There was an error while running the script: '+err;
		
		var params = {
			'status': 'failed',
			'message': msg,
			'end_time': '(now())'
		};

		dbHelper.openDb(function(err, dbConnection) {
			if(err) {
				console.log('Unable to establish database connection: '+err);
				process.exit();
				return;
			}

			dbConnection.query('UPDATE runs SET ? WHERE run_id = ?', [params, runId], 
		    	function(err, result){
		    		dbConnection.destroy();
		    		if (err) {
		                console.log('Unable to update run entry with error status and end time: '+err);
		            }

		            process.exit();
		    	});
		});
	};
	var onCompleteCb = function() {
		var msg = 'The run completed successfully';

		var params = {
			'status': 'successful',
			'message': msg
		};

		dbHelper.openDb(function(err, dbConnection) {
			if(err) {
				console.log('Unable to establish database connection: '+err);
				process.exit();
				return;
			}

			dbConnection.query('UPDATE runs SET ?, end_time=(now()) WHERE run_id = ?', [params, runId], 
		    	function(err, result){
		    		dbConnection.destroy();
		    		if (err) {
		                console.log('Unable to update run entry with status and end time: '+err);
		            }

		            process.exit();
		    	});
		});
	};
	var onResultCb = function(url, type, data) {
		if(type !== 'psi') {
			// This is in case we end up supporting
			// something other than pagespeed insights
			return;
		}

		resultsModel.addResult(runId, url, data, function(err){
			if(err) {
				// What can we do here? I don't believe we
				// can halt execution apart from process.exit
			}
		});
	};

	pagespeedMonitor.on('onResult', onResultCb);

	pagespeedMonitor.on('onError', onErrorCb);

	pagespeedMonitor.on('onCompleted', onCompleteCb);

	pagespeedMonitor.crawlSitemap(sitemapUrl);
}