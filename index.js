/*
 * pagespeed-monitor-cli
 * http://github.com/gauntface/pagespeed-monitor-cli
 *
 * Copyright (c) 2014 Google Inc.
 * Licensed under an Apache 2 license.
 */

'use strict';

var readline = require('readline');
var pagespeedMonitor = require('./../pagespeed-monitor');

function getURLFromUser() {
	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});
	var index = 0;
	rl.question("What is the URL for the sitemap you'd like to crawl? ", function(sitemapUrl) {
		rl.close();

		pagespeedMonitor.on('onResult', function(url, type, data) {
			if(data.score < 85) {
				console.log('---------------------------------');
				
				console.log('URL: '+url);
				console.log('Score: '+data.score);

				var ruleResults = data.formattedResults.ruleResults;
				console.log('Things to improve:');
				for(var ruleName in ruleResults) {
					var ruleResult = ruleResults[ruleName];
					if(ruleResult.ruleImpact > 0) {
						console.log('    - '+ruleResult.localizedRuleName);
						console.log('      '+ruleResult.ruleImpact);
					}
				}
				console.log('---------------------------------');
				console.log('');
				console.log('');
			}
			index++
		});

		pagespeedMonitor.on('onError', function(err) {
			getURLFromUser();
		});

		pagespeedMonitor.on('onCompleted', function() {
			getURLFromUser();
		});

		pagespeedMonitor.crawlSitemap(sitemapUrl);
	});
}

getURLFromUser();


