/*
 * pagespeed-monitor-cli
 * http://github.com/gauntface/pagespeed-monitor-cli
 *
 * Copyright (c) 2014 Google Inc.
 * Licensed under an Apache 2 license.
 */

'use strict';

var cronRunModel = require('./model/cronrunmodel.js');
var PSILib = require('webperf-lib-psi');
var resultsModel = require('./model/psiresultsmodel.js');

module.exports = function(configFilePath, config) {
  // Stash for other modules to use
  GLOBAL.configFile = configFilePath;

  //tryAnalytics();
  startNewRun(config.sitemapURL);
};

/**function tryAnalytics() {
  var analytics = require('./model/analytics-model.js');
  analytics.getVisits();
}**/

function startNewRun(sitemapUrl) {
  console.log('Setting up run for sitemap: ' + sitemapUrl);
  cronRunModel.addNewRunEntry()
		.then(function(result) {
  var runId = result;
  console.log('Added new run [' + runId + ']');
  performCrawl(runId, sitemapUrl);
	}).catch(function(err) {
    console.log('webperf-monitor startNewRun() Error: ' + err);
    process.exit();
  });
}

function performCrawl(runId, sitemapUrl) {
  var onErrorCb = function(err) {
    var msg = 'There was an error while running the script: ' + err;
    cronRunModel.endRunWithError(runId, msg)
      .then(function() {
        console.log('Run finished with an error: ' + err);
        process.exit();
      }).catch(function(err) {
        console.log('webperf-monitor performCrawl() Error: ' + err);
        process.exit();
      });
  };

  var onCompleteCb = function() {
    var msg = 'Run completed successfully';

    cronRunModel.endRunSuccessfully(runId, msg)
      .then(function() {
        console.log('Run finished successfully');
        process.exit();
      }).catch(function(err) {
        console.log('webperf-monitor performCrawl() Error: ' + err);
        process.exit();
      });
  };

  var onResultCb = function(url, type, data) {
    console.log('onResult: ' + url);
    if (type !== 'psi') {
      // This is in case we end up supporting
      // something other than pagespeed insights
      // But aren't quite handling it yet
      return;
    }

    resultsModel.addResult(runId, url, data)
      .then(function() {
    }).catch(function(err) {
      // What can we do here? I don't believe we
      // can halt execution apart from process.exit

      console.log('webperf-monitor performCrawl() Error: ' + err);
    });
  };

  PSILib.on('onResult', onResultCb);

  PSILib.on('onError', onErrorCb);

  PSILib.on('onCompleted', onCompleteCb);

  PSILib.crawlSitemap(sitemapUrl);
}
