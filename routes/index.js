const routes = require('express').Router();
const waterloo = require('./waterloo');
const sort = require('../helpers/sort');
const data = require('../routes/models/data');

routes.get('/', function(req, res){
  res.render('index');
})

routes.get('/wat/:course/:number', function(req, res){
  var course = req.params.course;
  var number = req.params.number;
  waterloo.getRequisites(course, number, output =>
    res.render('results', output));
})

routes.get('/wat/retrieve', function (req, res) {
  waterloo.getCourses(result => {
    if (result == 1) res.send("Data retrieved successfully.");
    else res.send("Data retrieval unsuccessful.");
  });
})

routes.get('/update/:file', function (req, res) {
  const file = req.params.file;
  waterloo.getCourses (result => {
    if (file == "data") {
      data.updateData(result.data, (err, result) => {
        if(err) console.error("Failed to update course list.");
        res.send("Course list updated successfully.\n" + result)
      });
    }

    else if (file == "course_list") {
      data.updateCourseList(result.data, (err, result) => {
        if(err) console.error("Failed to update course list.");
        res.send("Course list updated successfully.\n" + result)
      });
    }
  });
});

module.exports = routes;
