webperf-monitor
=====================

At the moment this is a CLI tool for stashing a pagespeed insights score for each URL retrieved from a sitemap.

You can install and run the module using the following command:

    npm install webperf-monitor -g
    webperfmonitor -c <Path to config file>.js

An example config file can be found in `config/config.sample.js` and looks like:

    exports.dbURL = {
            host     : 'localhost',
            user     : '<username>',
            password : '<password>',
            port: 8889
        };
    exports.dbName = 'webperfmonitor';
    exports.sitemapURL = 'http://<URL of your Sitemap>';

To run this as a cron job, try creating a file in /etc/cron.daily/webperf-monitor and add the following (This is still relatively untested):

    #! /bin/bash

    #
    #
    # Run Web Perf Monitor
    #
    #
    sudo npm cache clean
    sudo npm update -g

    sudo npm install webperf-monitor -g

    webperfmonitor -c /code/gauntface-deploy/webperfmonitor-config.js