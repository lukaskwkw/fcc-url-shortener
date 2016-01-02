var app_url = process.env.APP_URL  || "localhost:5000/";
var re_weburl = require('../../regex-weburl.js');
var http = require("http");
var url = require("url");


var newLinkHandler = function (originalUrl,link,localRes,db){
	var counter = db.collection('counter');
	var links = db.collection('links');

	
	function queryDb () {
		counter.findOne({}, function (err, resultCheckIfCounterExists) {
			if (err) { 
				console.log('resultCheckIfCounterExists');
				throw err;
			}
			if (resultCheckIfCounterExists){
				console.log('resultCheckIfCounterExists:pass results: ',resultCheckIfCounterExists);

				if (+resultCheckIfCounterExists.counter>500) {
					console.log("exceed db limit db.links.drop() counter drop() redirecting...");
					counter.drop();
					links.drop();
					localRes.redirect(app_url + originalUrl);
					return;
				};

				links.findOne({'orginal_url' : link},function  (err,resultCheckIfUrlExists) {
					if (err){ 
						console.log('Err: resultCheckIfUrlExists',err);
						throw err;
					}

					if (!resultCheckIfUrlExists){ // there is no url in database so lets create one

						counter.findAndModify({}, {'_id' : 1},{ $inc: { 'counter': 1 }}, {new : true}, function (err, resultFindAndModify) {
							if (err) {
								console.log('Err: resultFindAndModify',err);
								throw err;
							}
							var shortedUrl = resultFindAndModify.value.counter.toString(36);
							links.insert({'orginal_url' : link, 'short_url' : shortedUrl},function  (err,result) {
								if (err) throw err;
								localRes.end(JSON.stringify({original_url : link, short_url: app_url + shortedUrl}));
							});
						});
					}
					else // url is present in db so we just send full object to the browser (with fetched short_url from result)
					{
						localRes.end(JSON.stringify({original_url : link, short_url: app_url + resultCheckIfUrlExists.short_url}));
					}
				});
}	 
else{
				// jesli nie ma licznika to go stworz i usun kolekcje linkow
				// first 5 are reserved
				counter.insert({'counter':6}, function  (err,resultInsert1stCounter) {
					if (err) {
						console.log("resultInsert1stCounter");
						throw err;
					}
					links.drop();
					var shortedUrl = (6).toString(36);
					links.insert({'orginal_url' : link, 'short_url' : shortedUrl},function  (err,result) {
						if (err) throw err;
						localRes.end(JSON.stringify({original_url : link, short_url: app_url + shortedUrl}));
					});
				});
			}
		});
}

function testUrl () {
	var hostName = url.parse(link).hostname;
	var options = {
		method: 'HEAD',
		hostname: hostName,
		port: 80
	}

	http.request(options, function() { // testing url by sendig HEAD request to the hostname
		queryDb();
	}).on('error', function(e) {
		e.hostname = hostName;
		e.port = 80;
		localRes.end(JSON.stringify(e))
	}).end();

}

function validateUrl () {
	if (/https?:\/\//i.test(link)===false)
		link = "http://" + link;
	if (re_weburl.test(link)) 
		return true;
	else
		return false;
}

if (validateUrl())
	return testUrl();
else
	return localRes.end("invalid url");

}

module.exports = newLinkHandler;