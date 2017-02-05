const routes = require('express').Router();
const models = require('./models');
const waterloo = require('./waterloo');

routes.use('/models', models);

routes.get('/', function(req, res){
  res.render('index');
})

routes.get('/wat/:course/:number', function(req, res){
  var course = req.params.course;
  var number = req.params.number;
  waterloo.getRequisites(course, number, output =>
    res.render('results', output));
})

module.exports = routes;
