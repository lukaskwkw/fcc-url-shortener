'use strict';

var re_weburl = require('../../regex-weburl.js');
var http = require("http");
var url = require("url");
//0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
//

// var newHandler = function (link,localRes,db)

function testUrl (link, localRes) {
	var hostName = url.parse(link).hostname;
	var options = {
		method: 'HEAD',
		hostname: hostName,
		port: 80
	}
	http.request(options, function() {
		localRes.end(JSON.stringify({original_url : link, short_url: 'to do'}))

	}).on('error', function(e) {
		e.hostname = hostName;
		e.port = 80;
  localRes.end(JSON.stringify(e))
}).end();

}

function validateUrl (link, localRes) {
	if (/https?:\/\//i.test(link)===false)
		link = "http://" + link;
	if (re_weburl.test(link)) 
		return testUrl(link,localRes);
	else
		return localRes.end("invalid url");
}

module.exports = function (app, db) {

   app.get('/new/*', function  (req,res) {
   	validateUrl(req.params[0],res);
   })
};
