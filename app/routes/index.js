'use strict';
var app_url = "localhost:3000/";
var re_weburl = require('../../regex-weburl.js');
var http = require("http");
var url = require("url");
//0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
//

/*
To-DO:

I.Stworzyć nowy router do sprawdzenia skróconego linku
	1. Czy istnieje w bazie danych -> Jesli tak to odeslanie uzytkownika do przypisanego linku (redirect)
	 -> Jesli nie to wyswietlenie bledu

II. Sworzyc dzielnik licznika tak ze po przekroczeniu zestawu znakow (~62 znaki) dzielil licznik przez 62 bral floor i przechodzil petla
(warunek i < floor) i przy ostatnim dopisal znak o odpwiedniku (counter - 62*floor) 
albo reszta z dzielenia ((counter % 62) albo (counter mod 62)) <-- sprawdzic to na fcc  

 */

var newLinkHandler = function (link,localRes,db){
	var counter = db.collection('counter');
	var links = db.collection('links');
	var shortcutCharset = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',]
	function generateShortUrl (counter) {
		return app_url + shortcutCharset[counter];
	}
	function queryDb () {
		counter.findOne({}, function (err, result) {
			if (err) throw err;

			if (result){
				counter.findAndModify({'query' : {}}, {'_id' : 1},{ $inc: { 'counter': 1 }}, {new : true}, function (err, result) {
					if (err) throw err;

					links.findOne({'orginal_url' : link},function  (err,result) {
						if (err) throw err;
						if (!result){

							var shortedUrl = generateShortUrl(result.value.counter);
							links.insert({'orginal_url' : link, 'short_url' : shortedUrl},function  (err,result) {
								if (err) throw err;
								localRes.end(JSON.stringify({original_url : link, short_url: shortedUrl}));
								console.log(JSON.stringify(result),"url_insert");
							});
						}
						else
						{
							localRes.end(JSON.stringify({original_url : link, short_url: result.short_url}));
						}
					})
					console.log(JSON.stringify(result),"loko");
				});
			}
			else{
				// jesli nie ma licznika to go stworz i usun kolekcje linkow
				counter.insert({'counter':0}, function  (err,result) {
					console.log(JSON.stringify(result),'counter creating');
				});
				links.drop();
				/*
				Skonczyc tutaj:
				stworzenie kolekcji linkow poprzez dodanie jednego nowego
				 */ 
				
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
	http.request(options, function() {
			// localRes.end(JSON.stringify({original_url : link, short_url: 'to do'}))
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

	if (validateUrl(link, localRes))
		return testUrl(link,localRes);
	else
		return localRes.end("invalid url");

}

module.exports = function (app, db) {

	app.get('/new/*', function  (req,res) {
		newLinkHandler(req.params[0],res,db);
	})
};
