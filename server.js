// grab the packages we need
var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var path = require('path');
var waterloo = require('./waterloo')
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


// routes will go here

// start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// routes will go here
app.get('/api/users', function(req, res) {
  var user_id = req.param('id');
  var token = req.param('token');
  var geo = req.param('geo');

  res.send(user_id + ' ' + token + ' ' + geo);
});

// http://localhost:8080/api/1
app.get('/api/:version', function(req, res) {
  res.send(req.params.version);
});

// parameter middleware that will run before the next routes
app.param('name', function(req, res, next, name) {

    // check if the user with that name exists
    // do some validations
    // add -dude to the name
    var modified = name + '-dude';

    // save name to the request
    req.name = modified;

    next();
});

// http://localhost:8080/api/users/chris
app.get('/api/users/:name', function(req, res) {
    // the user was found and is available in req.user
    res.send('What is up ' + req.name + '!');
});


// POST http://localhost:8080/api/users
// parameters sent with
app.post('/api/users', function(req, res) {
    var user_id = req.body.id;
    var token = req.body.token;
    var geo = req.body.geo;

    res.send(user_id + ' ' + token + ' ' + geo);
});

app.get('/wat/:course/:number', function(req, res){
  var course = req.params.course;
  var number = req.params.number;
  waterloo.getRequisites(course, number, output =>
    res.render('index', {
      course: course + number,
      prereqs: output[0],
      coreqs: output[1],
      antireqs: output[2],
      string: output[3]
    }));
})

app.get('/', function(req, res){
  //waterloo.getPrereqs('CS', '245');
})
