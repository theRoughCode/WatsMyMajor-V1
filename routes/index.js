const routes = require('express').Router();
const waterloo = require('./waterloo');
const logic = require('../helpers/logic');
const data = require('../routes/models/data');
const Tree = require('../helpers/trees');

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
    if (file === "data") {
      data.resetData(result.data, (err, result) => {
        if(err) return res.send("Failed to update course list.");
        res.send("Course list updated successfully.  " + result)
      });
    }
    else if (file === "course_list") {
      data.updateCourseList(result.data, (err, result) => {
        if(err) res.send("Failed to update course list.");
        else res.send("Course list updated successfully. " + result)
      });
    }
    else if (file === "fill"){
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

routes.get('/trees/:subject/:cat_num', function (req, res) {
  const subject = req.params.subject.toUpperCase();
  const cat_num = req.params.cat_num;

  logic.getPrereqs(subject, cat_num, (err, node) => {
    if(err) {
      var err_msg = "Course: " + subject + " " + cat_num + " not found!";
      if(err === 2)
        err_msg = "Course: " + subject + " " + cat_num +
                        " has been deprecated!";
      else if (err === 3)
        err_msg = "Course: " + subject + " " + cat_num + " has no prereqs!";
      console.error(err_msg);
      return res.send(err_msg);
    }
    const tree = new Tree.Tree(subject, cat_num);
    tree._root.add(node);
    tree.getDepth(depth => {
      tree.getWidth(width => {
        tree._root.width = width;
        tree._root.depth = depth;
        const tree_json = JSON.stringify(tree);
        res.render('tree', { data: tree_json });
      });
    });
  });
})

routes.get('/test', function(req, res) {
  //waterloo.getCoreqs("PHYS", "234", coreqs => res.send(coreqs));
})

module.exports = routes;
