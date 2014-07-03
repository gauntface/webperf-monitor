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

	rl.question("What is the URL for the sitemap you'd like to crawl? ", function(sitemapUrl) {
		rl.close();

		pagespeedMonitor.on('onResult', function() {
			console.log('onResult');
		});
		
		pagespeedMonitor.crawlSitemap(sitemapUrl, function() {
			getURLFromUser();
		});
	});
}

getURLFromUser();


