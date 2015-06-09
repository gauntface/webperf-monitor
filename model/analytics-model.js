'use strict';

var googleapis = require('googleapis');

// H/T to Ian Barber for his help figuring this out
exports.getVisits = function() {
  var config = require(GLOBAL.configFile);
  if (!config) {
    console.err('No config file defined.');
    return;
  }

  var SERVICE_ACCOUNT_EMAIL = config.googleServiceAccountEmail;
  var SERVICE_ACCOUNT_KEY_FILE = config.googleServiceAccountKeyFile;

  var jwt = new googleapis.auth.JWT(
    SERVICE_ACCOUNT_EMAIL,
    SERVICE_ACCOUNT_KEY_FILE,
    null,
    ['https://www.googleapis.com/auth/analytics.readonly']);

  var client;
  googleapis
  .discover('analytics', 'v3')
  .execute(function(err, data) {
    if (err) {
      console.log('analytics-model.js Unable to get analytics API err: ' + JSON.stringify(err));
      return;
    }

    client = data;

    jwt.authorize(function(err, result) {
      if (err) {
        console.log('analytics-model.js JWT Authorize failed err: ' + JSON.stringify(err));
        return;
      }

      client.analytics.data.ga.get({
				'ids': 'ga:' + config.googleAnalyticsProfileId,
				'start-date': '2014-07-11',
				'end-date': '2014-07-12',
				'metrics': 'ga:visits'
			})
			.withAuthClient(jwt)
			.execute(
				function(err, result) {
          if (err) {
            console.log('analytics-model.js Unabled to get data from analytics err: ' + JSON.stringify(err));
            return;
          }

          console.log('Result: ' + JSON.stringify(result));
        });
    });
  });
};
