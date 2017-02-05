var express = require('express');
var app = express();
var waterloo = require('./controllers/waterloo');

app.get('/wat/:course/:number', function(req, res){
  var course = req.params.course;
  var number = req.params.number;
  waterloo.getRequisites(course, number, output =>
    res.render('results', output));
})
