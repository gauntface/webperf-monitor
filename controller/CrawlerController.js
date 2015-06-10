'use strict';

var parseString = require('xml2js').parseString;

var LogHelper = require('./../helper/LogHelper.js');

function CrawlerController() {

}

CrawlerController.prototype.crawlSitemap = function(sitemapUrl, cb) {
  LogHelper.log('Received sitemap url: ' + sitemapUrl);
  cb = cb || function() {};

  getSitemap(sitemapUrl, function(err, urls) {
    if (err) {
      cb(err);
      return;
    }

    cb(null, urls);
  });
};

function getSitemap(sitemapUrl, cb) {
  cb = cb || function() {};

  var httpRequest;
  if (sitemapUrl.indexOf('https') === 0) {
    httpRequest = require('https');
  } else {
    httpRequest = require('http');
  }

  var urls = [];
  httpRequest.get(sitemapUrl, function(res) {
    var xmlString = '';
    res.on('data', function(d) {
      xmlString += d;
    });

    res.on('end', function() {
        try {
          parseString(xmlString, function(err, result) {
            var xmlUrls = result.urlset.url;
            for (var i = 0; i < xmlUrls.length; i++) {
              urls.push(xmlUrls[i].loc[0]);
            }
            cb(null, urls);
          });
        } catch (exception) {
          LogHelper.error('Unabled to get sites from sitemap', exception);
          cb('Unable to get sites: ' + exception);
        }
      }.bind(this));
  }).on('error', function(e) {
    cb(e, null);
  });
}

module.exports = CrawlerController;
