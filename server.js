'use strict';

var express = require('express');
var mongo = require('mongodb');
var routes = require('./app/routes/index.js');
var dotenv = require('dotenv');
var app = express();

// dotenv.load();
var url = 'mongodb://'+process.env.dbuser+':'+process.env.dbpassword+'@ds037005.mongolab.com:37005/mongolkw';
// mongo.connect('mongodb://localhost:27017/urldb', function (err, db) {
mongo.connect(url, function (err, db) {

   if (err) {
      throw new Error('Database failed to connect!');
   } else {
      console.log('Successfully connected to MongoDB on port 27017.');
   }

   app.use(express.static(process.cwd() + '/public'));
   // app.use('/controllers', express.static(process.cwd() + '/app/controllers'));

   routes(app, db);

   app.listen(3000, function () {
      console.log('Node.js listening on port 3000...');
   });

});
