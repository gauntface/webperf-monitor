// SEE: http://www.openlogic.com/wazi/bid/342452/Promises-for-better-Node-js-coding
var when = require('when');
var dbHelper = require('./../db/db-helper.js');

function insertNewRun(dbConnection, resolve, reject) {
    var params = {
        status: 'pending',
        message: ''
    };

    dbConnection.query('INSERT INTO runs SET ?, start_time=(now())', params,
        function(err, result) {
            dbConnection.destroy();

            if (err) {
                reject('Unable to insert new run into \'runs\' table: '+err);
                return;
            }

            var runId = result.insertId;
            resolve(runId);
        });
}

function finishRunSuccessfully(runId, msg, dbConnection, resolve, reject) {
    getMeanRunScore(runId, dbConnection, function(err, meanScore) {
        if(err) {
            reject('Unable to calculate the mean score: '+err);
            return;
        }
        getMedianRunScore(runId, dbConnection, function(err, medianScore) {
            if(err) {
                reject('Unable to calculate the media score: '+err);
                return;
            }

            var params = {
                'status': 'successful',
                'message': msg,
                'mean_score': meanScore,
                'median_score': medianScore
            };

            dbConnection.query('UPDATE runs SET ?, end_time=(now()) WHERE run_id = ?', [params, runId], 
                function(err, result){
                    dbConnection.destroy();
                    if (err) {
                        reject('Unable to update run entry with status and end time: '+err);
                        return;
                    }

                    // TODO: Confirm results affected > 0

                    resolve();
                });
        });
    });
}

function getMeanRunScore(runId, dbConnection, cb) {
    dbConnection.query('SELECT AVG(score) as mean_val FROM run_entries WHERE run_id = ?', [runId], 
        function(err, result){
            if (err) {
                dbConnection.destroy();
                cb('Unable to update run entry with status and end time: '+err);
            }

            cb(null, result[0].mean_val);
        });
}

function getMedianRunScore(runId, dbConnection, cb) {
    var sqlQuery = 'SELECT avg(t1.score) as median_val FROM (' +
                    'SELECT @rownum:=@rownum+1 as `row_number`, run_entries.score ' +
                    '  FROM run_entries,  (SELECT @rownum:=0) r ' +
                    '  WHERE run_id = ? ' +
                    '  ORDER BY run_entries.score ' +
                    ') as t1, '+
                    '(' +
                    '  SELECT count(*) as total_rows ' +
                    '  FROM run_entries ' +
                    '  WHERE run_id = ? ' +
                    ') as t2 ' +
                    'WHERE 1 ' +
                    'AND t1.row_number in ( floor((total_rows+1)/2), floor((total_rows+2)/2) );';

    dbConnection.query(sqlQuery, [runId, runId], 
        function(err, result){
            JSON.stringify(result);
            if (err) {
                dbConnection.destroy();
                cb('Unable to update run entry with status and end time: '+err);
            }

            cb(null, result[0].median_val);
        });
}

function finishRunWithError(runId, msg, dbConnection, resolve, reject) {
    var params = {
        'status': 'failed',
        'message': msg,
        'end_time': '(now())'
    };

    dbConnection.query('UPDATE runs SET ? WHERE run_id = ?', [params, runId], 
        function(err, result){
            dbConnection.destroy();
            if (err) {
                reject('Unable to update run entry with error status and end time: '+err);
            }

            resolve();
        });
}

exports.addNewRunEntry = function(config) {
    dbHelper.setConfig(config);

    return when.promise(function(resolve, reject, notify){
        // do some (asynchronous) work; the promise will be pending meanwhile
        // if the operation is fulfilled successfully, call resolve(operationResult);
        // if there's an error or an exception is thrown, call reject(errorReason);

        dbHelper.openDb(function(err, dbConnection) {
            if(err) {
                reject('Unable to establish database connection: '+err);
                return;
            }

            insertNewRun(dbConnection, resolve, reject);
        });
    });
};

exports.endRunSuccessfully = function(runId, msg, config) {
    dbHelper.setConfig(config);

    return when.promise(function(resolve, reject, notify){
        // do some (asynchronous) work; the promise will be pending meanwhile
        // if the operation is fulfilled successfully, call resolve(operationResult);
        // if there's an error or an exception is thrown, call reject(errorReason);

        dbHelper.openDb(function(err, dbConnection) {
            if(err) {
                reject('Unable to establish database connection: '+err);
                return;
            }

            finishRunSuccessfully(runId, msg, dbConnection, resolve, reject);
        });
    });
};

exports.endRunWithError = function(runId, msg, config) {
    dbHelper.setConfig(config);

    return when.promise(function(resolve, reject, notify){
        // do some (asynchronous) work; the promise will be pending meanwhile
        // if the operation is fulfilled successfully, call resolve(operationResult);
        // if there's an error or an exception is thrown, call reject(errorReason);

        dbHelper.openDb(function(err, dbConnection) {
            if(err) {
                reject('Unable to establish database connection: '+err);
                return;
            }

            finishRunWithError(runId, msg, dbConnection, resolve, reject);
        });
    });
};