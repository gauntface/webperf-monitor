'use strict';

var when = require('when');
var dbHelper = require('./../db/db-helper.js');

exports.addResult = function(runId, url, data) {
  return when.promise(function(resolve, reject, notify) {
    dbHelper.openDb(function(err, dbConnection) {
      if (err) {
        if (dbConnection) {
          dbConnection.destroy();
        }
        reject('Unable to establish database connection: ' + err);
        return;
			}

      getURLID(url, dbConnection)
        .then(function(result) {
          var urlId = result;

          addRunUrlEntry(runId, urlId, data, dbConnection)
            .then(function(result) {
              var entryId = result;

              addRules(entryId, data, dbConnection)
                .then(function() {
                  dbConnection.destroy();
                  resolve(null);
                })
                .catch(function(err) {
                  dbConnection.destroy();
                  reject(err);
                });
            })
            .catch(function(err) {
              dbConnection.destroy();
              reject(err);
            });
        })
        .catch(function(err) {
          dbConnection.destroy();
          reject('Unable to get a URLID for ' + url + ': ' + err);
        });
    });
  });
};

function getURLID(url, dbConnection) {
  return when.promise(function(resolve, reject, notify) {
    dbConnection.query('SELECT * FROM urls WHERE url = ?', [url],
      function(err, result) {
        if (err) {
          reject('Unable to add URL to urls table: ' + err);
          return;
        }

        if (result.length > 1) {
          // TODO: Add warning message to the run
          console.log('WARNING: URL seems to have multiple ID\'s');

          resolve(result[0]['url_id']);
          return;
        } else if (result.length === 1) {
          resolve(result[0]['url_id']);
          return;
        }

        addURLToTable(url, dbConnection, resolve, reject);
      });
  });
}

function addURLToTable(url, dbConnection, resolve, reject) {
	// Need to add the url as it's not in the table
  dbConnection.query('INSERT INTO urls SET ?', {url: url},
  function(err, result) {
    if (err) {
      reject('Unable to insert URL into table: ' + err);
      return;
    }

    var urlId = result.insertId;
    resolve(urlId);
  });
}

function addRunUrlEntry(runId, urlId, data, dbConnection) {
  return when.promise(function(resolve, reject, notify) {
    var params = {
      'run_id': runId,
      'url_id': urlId,
      'score': data.score
    };
    dbConnection.query('INSERT INTO run_entries SET ?', params,
      function(err, result) {
        if (err) {
          reject('Unable to insert run entry into table: ' + err);
          return;
        }

        var entryId = result.insertId;
        resolve(entryId);
      });
  });
}

function addRules(entryId, data, dbConnection) {
  return when.promise(function(resolve, reject, notify) {
    var ruleResults = data.formattedResults.ruleResults;

    var ruleArray = [];
    for (var ruleName in ruleResults) {
      var ruleResult = ruleResults[ruleName];
      ruleResult.ruleName = ruleName;
      ruleArray.push(ruleResult);
    }

    addRulesToDb(entryId, ruleArray, 0, dbConnection, resolve, reject);
  });
}

function addRulesToDb(entryId, ruleArray, index,
	dbConnection, resolve, reject) {
  if (index >= ruleArray.length) {
    resolve();
    return;
  }

  var ruleResult = ruleArray[index];
  var params = {
		'entry_id': entryId,
		'rule_name': ruleResult.ruleName,
		'localized_rule_name': ruleResult.localizedRuleName,
		'rule_impact': ruleResult.ruleImpact
	};

  dbConnection.query('INSERT INTO rule_set SET ?', params,
    function(err, result) {
      if (err) {
        reject('Unable to insert run entry into table: ' + err);
        return;
      }

      addRulesToDb(entryId, ruleArray, index + 1,
				dbConnection, resolve, result);
    }.bind(this));
}
