'use strict';

var express = require('express');
var mongo = require('mongodb');
var routes = require('./app/routes/index.js');
var dotenv = require('dotenv');
var app = express();
app.set('port',(process.env.PORT || 5000));

dotenv.load();
var url = 'mongodb://'+process.env.dbuser+':'+process.env.dbpassword+'@ds037005.mongolab.com:37005/mongolkw';
// mongo.connect('mongodb://localhost:27017/urldb', function (err, db) {
mongo.connect(url, function (err, db) {

   if (err) {
      throw new Error('Database failed to connect!');
   } else {
      console.log('Successfully connected to MongoDB on port 27017.');
   }

   app.use(express.static(process.cwd() + '/public'));
   app.use(express.static(process.cwd() + '/app/controllers'));

   routes(app, db);

   app.listen(app.get('port'), function () {
      console.log('Node.js listening on port',app.get('port'));
   });

});
