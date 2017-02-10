const routes = require('express').Router();
const waterloo = require('./waterloo');
const logic = require('../helpers/logic');
const data = require('../routes/models/data');
const trees = require('../helpers/trees');

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

routes.get('/test/:subject/:cat_num', function (req, res) {
  const subject = req.params.subject.toUpperCase();
  const cat_num = req.params.cat_num;

  logic.getPrereqs(subject, cat_num, (err, data) => {
    if(err) {
      var err_msg = "Course: " + subject + " " + cat_num + " not found!"
      if(err === 2)
        err_msg = "Course: " + subject + " " + cat_num +
                        " has been deprecated!";
      else if (err === 3)
        err_msg = "Course: " + subject + " " + cat_num + " has no prereqs!";
      console.error(err_msg);
      return res.send(err_msg);
    }
    console.log(data);
    res.send(data);
  });
})

routes.get('/trees', function(req, res) {
  const tree =  new trees.Tree("MATH", "247");
  /*tree.add("MATH", "146", "MATH", "247", tree.traverseBF);
  tree.add("MATH", "148", "MATH", "247", tree.traverseBF);

  tree.add('MATH', '145', "MATH", "146", tree.traverseBF);
  tree.add('MATH', '147', "MATH", "148", tree.traverseBF);*/

  var node1 = new trees.Node("MATH", "146");
  node1.add(new trees.Node('MATH', '145'));
  var node2 = new trees.Node("MATH", "148");
  node2.add(new trees.Node('MATH', '147'));
  tree._root.add(node1);
  tree._root.add(node2);

  tree.traverseDF(node => {
    console.log(node.data.subject + node.data.catalog_number + ", layer: " + node.layer);
    if(node.parent) console.log("Parent: " + node.parent.data.subject + node.parent.data.catalog_number + ", layer: " + node.parent.layer + "\n");
  });
  tree.getDepth(depth => {
    tree.getWidth(width => res.send("width: " + width + ", depth: " + depth));
  });
})

module.exports = routes;
