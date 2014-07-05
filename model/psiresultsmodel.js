var dbHelper = require('./../db/db-helper.js');
var config = require('./../config/config.js');

exports.addResult = function(runId, url, data, cb) {
	dbHelper.setConfig(config);
	dbHelper.openDb(function(err, dbConnection) {
		if(err) {
			console.log('Unable to establish database connection: '+err);
			if(cb) {
				cb('Unable to establish database connection: '+err);
			}
			return;
		}

		getURLID(url, dbConnection, function(err, urlId){
			if(err) {
				dbConnection.destroy();
				if(cb) {
					cb(err);
				}
				return;
			}

			addRunUrlEntry(runId, urlId, data, dbConnection, 
				function(err, entryId){
					if(err) {
						dbConnection.destroy();
						if(cb) {
							cb(err);
						}
						return;
					}
					addRules(entryId, data, dbConnection, function(err){
						dbConnection.destroy();

						if(err) {
							if(cb) {
								cb(err);
							}
							return;
						}

						cb(null);
					});
				});
		});
	});
};

function getURLID(url, dbConnection, cb) {
	dbConnection.query('SELECT * FROM urls WHERE url = ?', [url],
		function(err, result) {
			if (err) {
            	console.log('Unable to add URL to urls table: '+err);
            	if(cb) {
            		cb('Unable to add URL to urls table: '+err);
            	}
                return;
            }

            if(result.length > 1) {
            	// TODO: Add warning message to the run
            	return;
            } else if(result.length == 1) {
            	var urlId = result[0]['url_id'];
            	cb(null, urlId);
            	return;
            }
            
            addURLToTable(url, cb, dbConnection);
		});
}

function addURLToTable(url, cb, dbConnection) {
	// Need to add the url as it's not in the table
    dbConnection.query('INSERT INTO urls SET ?', {url: url}, 
    	function(err, result){
    		if (err) {
                cb('Unable to insert URL into table: '+err);
                return;
            }

            var urlId = result.insertId;
            cb(null, urlId);
    	});
}

function addRunUrlEntry(runId, urlId, data, dbConnection, cb) {
	var params = {
		'run_id': runId,
		'url_id': urlId,
		'score': data.score
	};
	dbConnection.query('INSERT INTO run_entries SET ?', params, 
    	function(err, result){
    		if (err) {
                cb('Unable to insert run entry into table: '+err);
                return;
            }

            var entryId = result.insertId;
            cb(null, entryId);
    	});
}

function addRules(entryId, data, dbConnection, cb) {
	var ruleResults = data.formattedResults.ruleResults;

	var ruleArray = [];
	for(var ruleName in ruleResults) {
		var ruleResult = ruleResults[ruleName];
		ruleResult.ruleName = ruleName;
		ruleArray.push(ruleResult);
	}

	addRulesToDb(entryId, ruleArray, 0, dbConnection, cb);
}

function addRulesToDb(entryId, ruleArray, index, dbConnection, cb) {
	if(index >= ruleArray.length) {
		cb(null);
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
    	function(err, result){
    		if (err) {
                cb('Unable to insert run entry into table: '+err);
                return;
            }

            addRulesToDb(entryId, ruleArray, index+1, dbConnection, cb);
    	});
}