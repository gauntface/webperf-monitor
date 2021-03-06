'use strict';

var mysql = require('mysql');

var tables = [
    'CREATE TABLE IF NOT EXISTS urls (' +
    'url_id INT NOT NULL AUTO_INCREMENT,' +
    'PRIMARY KEY(url_id),' +
    'url TEXT NOT NULL' +
    ')',
    'CREATE TABLE IF NOT EXISTS runs (' +
    'run_id INT NOT NULL AUTO_INCREMENT,' +
    'PRIMARY KEY(run_id),' +
    'status TEXT NOT NULL,' +
    'message TEXT,' +
    'start_time DATETIME,' +
    'end_time DATETIME,' +
    'mean_score DECIMAL,' +
    'median_score DECIMAL' +
    ')',
    'CREATE TABLE IF NOT EXISTS run_entries (' +
    'entry_id INT NOT NULL AUTO_INCREMENT,' +
    'PRIMARY KEY(entry_id),' +
    'url_id TEXT NOT NULL,' +
    'run_id INT NOT NULL,' +
    'speed_score INT NOT NULL,' +
    'ux_score INT NOT NULL,' +
    'num_of_resources INT DEFAULT 0 NOT NULL,' +
    'total_request_bytes INT DEFAULT 0 NOT NULL,' +
    'html_request_bytes INT DEFAULT 0 NOT NULL,' +
    'css_request_bytes INT DEFAULT 0 NOT NULL,' +
    'image_request_bytes INT DEFAULT 0 NOT NULL,' +
    'js_request_bytes INT DEFAULT 0 NOT NULL,' +
    'other_request_bytes INT DEFAULT 0 NOT NULL' +
    ')',
    'CREATE TABLE IF NOT EXISTS rule_set (' +
    'id INT NOT NULL AUTO_INCREMENT,' +
    'PRIMARY KEY(id),' +
    'entry_id INT NOT NULL,' +
    'rule_name TEXT NOT NULL,' +
    'localized_rule_name TEXT NOT NULL,' +
    'rule_impact DECIMAL NOT NULL' +
    ')'
];

exports.openDb = function(cb) {
  var config = require(GLOBAL.configFile);

  if (config === null) {
    cb('No Config Available to load the database');
    return;
  }

  var connection = mysql.createConnection(config.dbURL);

  // a connection can also be implicitly established by invoking a query
  connection.query('CREATE DATABASE IF NOT EXISTS ' + config.dbName,
  function(err) {
    if (err) {
      cb('Unable to create the database [' + config.dbName + ']');
      return;
    }

    connection.query('USE ' + config.dbName, function(err) {
      if (err) {
        cb('Unable to use the database [' + config.dbName + ']');
        return;
      }

      initTable(connection, 0, cb);
    });
  });
};

function initTable(connection, index, cb) {
  if (index >= tables.length) {
    cb(null, connection);
    return;
  }

  connection.query(tables[index],
    function(err) {
      if (err) {
        cb(err);
        return;
      }

      index++;
      initTable(connection, index, cb);
    });
}
