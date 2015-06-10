'use strict';

var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var path = require('path');

var LogHelper = require('./../helper/LogHelper.js');
var RunsModel = require('./../model/RunsModel.js');

function FrontEndController(configFilePath, c) {
  var config = c;

  var app = this.setupExpressServer();

  this.getConfig = function() {
    return config;
  };

  var server = app.listen(3000, function() {
    LogHelper.log('Listening on port ' + server.address().port);
  }.bind(this));
}

FrontEndController.prototype.setupExpressServer = function() {
  var app = express();

  var appDir = path.dirname(require.main.filename);
  console.log('Using appDir: ' + appDir);
  //app.engine('hbs', exphbs({extname:'.hbs', defaultLayout: 'main'}));
  //app.set('view engine', 'hbs');
  app.set('views', path.join(appDir, '/frontend/views'));
  app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(appDir, '/frontend/views/layouts')
  }));
  app.set('view engine', 'handlebars');

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  app.get('/', function(req, res) {
    res.render('settings');
  });//this.getIndexRequest.bind(this));

  app.use('/styles', express.static(appDir + '/frontend/dist/styles'));
  app.use('/scripts', express.static(appDir + '/frontend/dist/scripts'));

  return app;
};

FrontEndController.prototype.getIndexRequest = function(req, res) {
  RunsModel.getLatestCompleteRun()
    .then(function(result) {
      // jscs:disable
      var runId = result['run_id'];
      // jscs:enable
      getTopResultsForRun(runId, 3, function(err, topPagesResults) {
        if (err) {
          console.error(err);
          res.status(500).send('Something broke! ' + err);
          return;
        }

        getWorstResultsForRun(runId, 3, function(err, worstPagesResults) {
          if (err) {
            console.error(err);
            res.status(500).send('Something broke! ' + err);
            return;
          }

          getPreviousScoreAverages(function(err, scoreAverages) {
            if (err) {
              console.error(err);
              res.status(500).send('Something broke! ' + err);
              return;
            }

            getBiggestPagesByTotalResources(runId, 3,
                function(err, biggestTotalResourcePages) {
                  if (err) {
                    console.error(err);
                    res.status(500).send('Something broke! ' + err);
                    return;
                  }
                  console.log('Got here');

                  /**res.render('home', {
                    cssfile: 'styles/home.css',
                    topSites: topPagesResults,
                    worstSites: worstPagesResults,
                    scoreAverages: scoreAverages,
                    biggestTotalResourcePages: biggestTotalResourcePages
                  });**/
                  res.render('settings');

                  console.log('Got here 2');
                  //res.status(500).send('Something broke! ' + JSON.stringify(biggestTotalResourcePages));
                });
          });
        });
      });
    })
    .catch(function(err) {
      console.log('Got error');
      console.error(err);
      res.status(500).send('Something broke! ' + err);
    });
};

function getTopResultsForRun(runId, numOfResults, cb) {
  if (!cb) {
    return;
  }

  numOfResults = numOfResults || 10;
  RunsModel.getTopResultsForRun(runId, numOfResults)
    .then(function(result) {
      cb(null, result);
    })
    .catch(function(err) {
      cb(err);
    });
}

function getWorstResultsForRun(runId, numOfResults, cb) {
  if (!cb) {
    return;
  }

  numOfResults = numOfResults || 10;
  RunsModel.getWorstResultsForRun(runId, numOfResults)
    .then(function(result) {
      cb(null, result);
    })
    .catch(function(err) {
      cb(err);
    });
}

function getPreviousScoreAverages(cb) {
  if (!cb) {
    return;
  }
  var numberOfDays = 30 * 3;
  RunsModel.getPreviousScoreAverages(numberOfDays)
    .then(function(result) {
      cb(null, result);
    })
    .catch(function(err) {
      cb(err);
    });
}

function getBiggestPagesByTotalResources(runId, numOfResults, cb) {
  if (!cb) {
    return;
  }

  numOfResults = numOfResults || 10;
  RunsModel.getBiggestPagesByTotalResources(runId, numOfResults)
    .then(function(result) {
      cb(null, result);
    })
    .catch(function(err) {
      cb(err);
    });
}

module.exports = FrontEndController;
