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
    var params = {
        'status': 'successful',
        'message': msg
    };

    dbConnection.query('UPDATE runs SET ?, end_time=(now()) WHERE run_id = ?', [params, runId], 
        function(err, result){
            dbConnection.destroy();
            if (err) {
                reject('Unable to update run entry with status and end time: '+err);
            }

            // TODO: Confirm results affected > 0

            resolve();
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