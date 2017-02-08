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
      data.resetData(result.data, (err, result) => {
        if(err) res.send("Failed to update course list.");
        else res.send("Course list updated successfully.  " + result)
      });
    }
    else if (file == "course_list") {
      data.updateCourseList(result.data, (err, result) => {
        if(err) res.send("Failed to update course list.");
        else res.send("Course list updated successfully. " + result)
      });
    }
    else if (file == "fill"){
      data.fillEntries((err, data) => {
        if(err) return res.send("Failed to fill course data.");
        else res.send("Course data filled successfully. " + data);
      });
    }
  });
});

routes.get('/test', function (req, res) {
  data.fill((err, courses) => {
    //if(err) return console.log("Last Course: " + waterloo.last_course);
    if(err) console.log("Failed");
    res.send(courses);
  });
})

module.exports = routes;
