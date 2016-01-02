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
	 -> Jesli nie to wyswietlenie informacji o braku linku w bazie danych

II. Sworzyc dzielnik licznika tak ze po przekroczeniu zestawu znakow (~62 znaki) dzielil licznik przez 62 bral floor i przechodzil petla
(warunek i < floor) i przy ostatnim dopisal znak o odpwiedniku (counter - 62*floor) 
albo reszta z dzielenia ((counter % 62) albo (counter mod 62)) <-- sprawdzic to na fcc  


III. Utworzyc mongo na heroku
	-> https://scotch.io/tutorials/use-mongodb-with-a-node-application-on-heroku

IV. Zdeklarowac rozmiar bazy danych i ewentualnie ilosc indeksow po ktorych baza musi nadpisywac stare indeksy

V. Zastosowac wbudowane indeksy np. dla freecodecamp.com/map = myproject.heroku.com/g (nieusuwalne nawet po przekroczeniu)
Kolejnosc sprawdzania > pierw linki z bazy danych > jak nie znajdzie to > linki wbudowane > jak nie znajdzie to stworz nowy albo 
wyswietl info ze nie ma 

*/

var newLinkHandler = function (link,localRes,db){
	var counter = db.collection('counter');
	var links = db.collection('links');
	var shortcutCharset = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',]
	var shortcutCharsetTest = ['a','b','c'];

	function generateShortUrl (counter) {
		var tmp_url = app_url; // in order to not changing orginal application url
		var charsetLength = shortcutCharsetTest.length;
		var numberOfChars = Math.floor(counter/charsetLength); // number of characters to put into short url
		console.log(numberOfChars);
		for (var i = 0; i < numberOfChars; i++) {	// loop for number of last characters (until left last char to put in short url)
			tmp_url += shortcutCharsetTest[charsetLength-1]
		};
		//here we handle last char		
		var reminder = counter % (charsetLength-1);
		console.log(reminder);
		return tmp_url += shortcutCharsetTest[reminder];
	}
	
	function queryDb () {
		counter.findOne({}, function (err, resultCheckIfCounterExists) {
			if (err) throw err;

			if (resultCheckIfCounterExists){

				links.findOne({'orginal_url' : link},function  (err,resultCheckIfUrlExists) {
					if (err) throw err;

					if (!resultCheckIfUrlExists){ // there is no url in database so lets create one

						counter.findAndModify({'query' : {}}, {'_id' : 1},{ $inc: { 'counter': 1 }}, {new : true}, function (err, resultFindAndModify) {
							if (err) throw err;

							var shortedUrl = generateShortUrl(resultFindAndModify.value.counter);
							console.log(shortedUrl,"semething");
							// return;
							links.insert({'orginal_url' : link, 'short_url' : shortedUrl},function  (err,result) {
								if (err) throw err;
								localRes.end(JSON.stringify({original_url : link, short_url: shortedUrl}));
								console.log(JSON.stringify(result),"url_insert");
							});
						});
						// console.log(JSON.stringify(result),"loko");
					}
					else // url is present in db so we just send full object to the browser (with fetched short_url from result)
					{
						localRes.end(JSON.stringify({original_url : link, short_url: resultCheckIfUrlExists.short_url}));
					}
				});
			} 
			else{
				// jesli nie ma licznika to go stworz i usun kolekcje linkow
				counter.insert({'counter':0}, function  (err,result) {
					if (err) throw err;

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
