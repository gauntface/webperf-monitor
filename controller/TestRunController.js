'use strict';

var cronRunModel = require('./../model/cronrunmodel.js');
var resultsModel = require('./../model/psiresultsmodel.js');
var LogHelper = require('./../helper/LogHelper.js');
var CrawlerController = require('./CrawlerController.js');
var PagespeedController = require('./PagespeedController.js');

function TestRunController(configFilePath, c) {
  // Stash for other modules to use
  GLOBAL.configFile = configFilePath;

  var config = c;

  this.getSitemapUrl = function() {
    return config.sitemapURL;
  };
}

/**function tryAnalytics() {
  var analytics = require('./model/analytics-model.js');
  analytics.getVisits();
}**/

TestRunController.prototype.startNewRun = function() {
  //tryAnalytics();
  var sitemapUrl = this.getSitemapUrl();
  LogHelper.log('Setting up run for sitemap: ' + sitemapUrl);
  cronRunModel.addNewRunEntry()
		.then(function(result) {
      var runId = result;
      LogHelper.log('Added new run [' + runId + ']');
      this.performCrawl(runId, sitemapUrl);
    }.bind(this))
    .catch(function(err) {
      LogHelper.log('webperf-monitor startNewRun() Error: ' + err);
    });
};

TestRunController.prototype.performCrawl = function(runId, sitemapUrl) {
  var onErrorCb = function(err) {
    var msg = 'There was an error while running the script: ' + err;
    cronRunModel.endRunWithError(runId, msg)
      .then(function() {
        LogHelper.log('Run finished with an error: ' + err);
      }).catch(function(err) {
        LogHelper.log('webperf-monitor performCrawl() Error: ' + err);
      });
  };

  /**var onCompleteCb = function() {
    var msg = 'Run completed successfully';

    cronRunModel.endRunSuccessfully(runId, msg)
      .then(function() {
        LogHelper.log('Run finished successfully');
        process.exit();
      }).catch(function(err) {
        LogHelper.log('webperf-monitor performCrawl() Error: ' + err);
        process.exit();
      });
  };

  var onResultCb = function(url, type, data) {
    LogHelper.log('onResult: ' + url);
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

      LogHelper.log('webperf-monitor performCrawl() Error: ' + err);
    });
  };**/

  //PSILib.on('onResult', onResultCb);

  //PSILib.on('onError', onErrorCb);

  //PSILib.on('onCompleted', onCompleteCb);

  var crawlerController = new CrawlerController();
  crawlerController.crawlSitemap(sitemapUrl, function(err, urlArray) {
      if (err) {
        onErrorCb('Unable to fetch and parse the sitemap: ' +
					JSON.stringify(err));
        return;
      }

      this.testURls(runId, urlArray);
    }.bind(this));
};

TestRunController.prototype.testURls = function(runId, urlArray) {
  var pagespeedController = new PagespeedController();

  var onErrorCb = function(err) {
    var msg = 'There was an error while running the script: ' + err;
    cronRunModel.endRunWithError(runId, msg)
      .then(function() {
        LogHelper.log('Run finished with an error: ' + err);
      }).catch(function(err) {
        LogHelper.log('webperf-monitor performCrawl() Error: ' + err);
      });
  };

  var onCompleteCb = function() {
    var msg = 'Run completed successfully';

    cronRunModel.endRunSuccessfully(runId, msg)
      .then(function() {
        LogHelper.log('Run finished successfully');
      }).catch(function(err) {
        LogHelper.log('webperf-monitor performCrawl() Error: ' + err);
      });
  };

  var onResultCb = function(url, type, data) {
    LogHelper.log('onResult: ' + url);
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

      LogHelper.log('webperf-monitor performCrawl() Error: ' + err);
    });
  };

  pagespeedController.on('onResult', onResultCb);

  pagespeedController.on('onError', onErrorCb);

  pagespeedController.on('onCompleted', onCompleteCb);

  pagespeedController.scoreUrls(urlArray);
};

module.exports = TestRunController;
