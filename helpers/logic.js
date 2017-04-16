const data = require('../routes/models/data');
const async = require('async');
const Tree = require('./trees');
const deprec_courses = [
  "CHEM256", "MATH108", "MATH125"
]

// returns all courses needed to take
function getPrereqs (subject, cat_num, callback) {
  data.getJSON(data.DATA, (error, res) => {
    retrievePrereqs(subject, cat_num, res, (err, node) => callback(err, node));
  });
}

// returns prereqs of course (err, string)
function retrievePrereqs (subject, cat_num, dataset, callback) {
  // course doesn't exist
  if (!dataset[subject][cat_num])
    return callback(1, null);
  // course has been deprecated
  if(deprec_courses.indexOf(subject + cat_num) > -1)
    return callback(2, null);
  const prereqs = dataset[subject][cat_num]["prereqs"];
  if(prereqs.length === 0) return callback(3, null);

  dataToString(prereqs, dataset, node => callback(null, node));
}

// return (String)
function dataToString (val, dataset, callback) {
  const val_type = typeof(val);
  if (val_type === "string") {
    // inserts white space between numbers and letters
    const re_space = /[^0-9\s](?=[0-9])/g;
    val = val.replace(re_space, '$& ');
    const arr = val.split(" ");
    const subject = arr[0];
    const cat_num = arr[1];
    var node = new Tree.Node(subject, cat_num);
    retrievePrereqs(subject, cat_num, dataset, (err, childNode) => {
      if (!err) node.add(childNode);
      return callback(node);
    });
  }
  else if (Array.isArray(val)) {
    // [1, "course 1", "course 2"]
    if (typeof(val[0]) === "number") {
      var node = new Tree.Node(null, null);
      node.data.choose = val[0];
      node.name = null;
      async.eachSeries(val.slice(1), function (elem, callback1) {
        dataToString(elem, dataset, childNode => {
          node.add(childNode);
          callback1();
        })
      }, err => {
        if(err) console.error(err);
        return callback(node);
      })
    }
    // ["course 1", "course 2"]
    else {
      var node = new Tree.Node(null, null);
      node.data.choose = 0;
      node.name = null;
      async.eachSeries(val, function (elem, callback1) {
        dataToString(elem, dataset, childNode => {
          node.add(childNode);
          return callback1();
        });
      }, err => {
        if (err) console.error(err);
        return callback(node);
      })
    }
  } else {
    console.log("ERROR: This should not be running.");
    callback(null);
  }
}

module.exports = {
  getPrereqs
}
