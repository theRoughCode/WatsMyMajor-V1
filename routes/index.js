const routes = require('express').Router();
const waterloo = require('./waterloo');
const logic = require('../helpers/logic');
const data = require('../routes/models/data');
const update = require('../routes/models/update');
const Tree = require('../helpers/trees');

routes.get('/', function(req, res){
  res.render('index');
})

routes.get('/wat/:course/:number', function(req, res){
  const course = req.params.course.toUpperCase();
  const number = req.params.number;
  waterloo.getReqInfo(course, number, output => {
    waterloo.getParentReqs(course, number, parents => {
      output["parPrereq"] = (parents[0].length > 0) ? parents[0] : null;
      output["parCoreq"] = (parents[1].length > 0) ? parents[1] : null;
      res.render('results', output);
    });
  });
})

routes.get('/wat/retrieve', function (req, res) {
  waterloo.getCourses(result => {
    if (result == 1) return res.send("Data retrieved successfully.");
    res.send("Data retrieval unsuccessful.");
  });
})

// update JSON data
routes.get('/update/:type', function (req, res) {
  const type = req.params.type.toLowerCase();
  if (type === 'fill') {
    update.fillEntries((err, data) => {
      if(err) return res.send("Failed to fill course data.");
      res.send("Course data filled successfully. " + data);
    });
  } else {
    waterloo.getCourses (result => {
      if (type === "reset") {
        update.resetData(result.data, (err, result) => {
          if(err) return res.send("Failed to reset course list.");
          res.send("Course list reset.  " + result)
        });
      }
      else if (type === "course_list") {
        update.updateCourseList(result.data, (err, result) => {
          if(err) res.send("Failed to update course list.");
          else res.send("Course list updated successfully. " + result)
        });
      }
    });
  }
});

routes.get('/update/:subject/:cat_num', function (req, res) {
  const subject = req.params.subject.toUpperCase();
  const cat_num = req.params.cat_num;
  update.fillEntry(subject, cat_num, (err, json) => {
    res.send(json[`${subject}`][`${cat_num}`]);
  });
})

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
});

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
    new Tree.Tree(subject, cat_num, tree => {
      tree._root.add(node);
      tree.getDepth(depth => {
        tree.getWidth(width => {
          tree._root.maxwidth = width;
          tree._root.maxdepth = depth;
          const tree_json = JSON.stringify(tree);
          res.render('tree', {
            subject: subject,
            cat_num: cat_num,
            data: tree_json
          });
        });
      });
    });
  });
});

routes.get('/test/:subject/:cat_num', function(req, res) {
  const subject = req.params.subject.toUpperCase();
  const cat_num = req.params.cat_num;

  waterloo.getReqs(subject, cat_num, (err, json) => res.send(json));
})

module.exports = routes;
