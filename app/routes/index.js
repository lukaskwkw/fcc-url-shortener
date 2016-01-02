'use strict';
var newLinkHandler = require('../controllers/newLinkHandler.server.js');


/*
To-DO:

I.Stworzyć nowy router do sprawdzenia skróconego linku
	1. Czy istnieje w bazie danych -> Jesli tak to odeslanie uzytkownika do przypisanego linku (redirect)
	 -> Jesli nie to wyswietlenie informacji o braku linku w bazie danych
	CHECK!

III. Utworzyc mongo na heroku
	-> https://scotch.io/tutorials/use-mongodb-with-a-node-application-on-heroku

IV. Zdeklarowac rozmiar bazy danych i ewentualnie ilosc indeksow po ktorych baza musi nadpisywac stare indeksy
REALIZED IN DIFFERENT WAY

V. Zastosowac wbudowane indeksy np. dla freecodecamp.com/map = myproject.heroku.com/g (nieusuwalne nawet po przekroczeniu)
Kolejnosc sprawdzania > pierw linki z bazy danych > jak nie znajdzie to > linki wbudowane 
CHECK

*/

function  shortRedirectHandler (short_code,res,db) {
	
		var links = db.collection('links');
		if (6>Number(short_code))
		{
			var redirectTo = reserved_urls[short_code];
			if (!redirectTo){
				res.end("no url matched.");
				return;
			}
			res.redirect(redirectTo);
			res.end();
			return;
		}

		links.findOne({'short_url':short_code},function  (err,result) {
			if (err) throw err;
			if (!result) {
				res.end("no url matched");
				return;
			};
			res.redirect(result.orginal_url);
		});
	
}

var reserved_urls = {
	2: "http://www.freecodecamp.com/news"
}

module.exports = function (app, db) {

	app.get('/new/*', function  (req,res) {
		newLinkHandler(req.originalUrl,req.params[0],res,db);
	})

	app.get('/:short',function  (req,res) {
		shortRedirectHandler(req.params.short,res,db);
	})
};
