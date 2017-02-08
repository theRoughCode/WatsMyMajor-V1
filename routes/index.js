const routes = require('express').Router();
const waterloo = require('./waterloo');
const logic = require('../helpers/logic');
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
    if (result == 1) return res.send("Data retrieved successfully.");
    res.send("Data retrieval unsuccessful.");
  });
})

routes.get('/update/:file', function (req, res) {
  const file = req.params.file.toLowerCase();
  waterloo.getCourses (result => {
    if (file == "data") {
      data.resetData(result.data, (err, result) => {
        if(err) return res.send("Failed to update course list.");
        res.send("Course list updated successfully.  " + result)
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
        res.send("Course data filled successfully. " + data);
      });
    }
  });
});

routes.get('/get/:file', function (req, res) {
  const file = req.params.file.toUpperCase();
  data.getJSON(data[file], (err, data) => {
    if(err) {
      console.error(err);
      return res.send("Error retrieving " + file);
    }
    console.log(data);
    res.send(data);
  })
})

routes.get('/test', function (req, res) {
  logic.getPrereqs("PHYS", "434", (err, data) => {
    if(err) {
      console.error(err);
      return res.send(err);
    }
    console.log(data);
    res.send(data);
  });
})

module.exports = routes;
