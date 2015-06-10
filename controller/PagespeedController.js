'use strict';

var pagespeed = require('gpagespeed');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var LogHelper = require('./../helper/LogHelper.js');

function PageSpeedController() {
  EventEmitter.call(this);
}

util.inherits(PageSpeedController, EventEmitter);

PageSpeedController.prototype.scoreUrls = function(urlsArray, timeout) {
  timeout = timeout || 500;
  var options = {
    // key: '...', optional
    paths: '',           // optional
    locale: 'en_GB',     // optional
    strategy: 'mobile',  // optional
    threshold: 80        // optional
  };
  options.nokey = options.key === void 0;
  this.getPSIScrores(0, urlsArray, options, new Date().getTime());
};

PageSpeedController.prototype.getPSIScrores =
  function(index, urlsArray, options, prevQueryTime) {
  if (index >= urlsArray.length) {
    //cb('onCompleted');
    this.emit('onCompleted');
    return;
  }

  if (options.nokey) {
    // This is to make sure we aren't hitting any rate limits
    var workTime = new Date().getTime() - prevQueryTime;
    if (workTime < 500) {
      /**setTimeout(function() {
        try {
          this.getPSIScrores(index, urlsArray, options, prevQueryTime);
        } catch (e) {
          LogHelper.error(e);
        }
      }.bind(this), 500 - workTime);
      return;**/
    }
  }

  options.url = urlsArray[index];

  pagespeed(options, function(err, data) {
    if (err) {
      LogHelper.error(err);
      this.emit('onError', 'There was an error while running PageSpeed ' +
        'Insights against ' + options.url + ': ' + JSON.stringify(err));
      return;
    }
    this.emit('onResult', urlsArray[index], 'psi', data);

    prevQueryTime = new Date().getTime();
    this.getPSIScrores(index + 1, urlsArray, options, prevQueryTime);
  }.bind(this));
};

module.exports = PageSpeedController;
