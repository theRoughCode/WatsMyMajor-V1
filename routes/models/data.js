const fs = require('fs');
const waterloo = require('../waterloo');
const async = require('async');
const COURSE_LIST = './course_list.json';
const DATA = './data.json';
const TREE = './tree.json';

// updates course_list.json.  Returns 1 if unsuccessful
function updateCourseList (res, callback) {
  const courses = [];
  res.forEach(course => {
    const subject = course.subject;
    const catalog_number = course.catalog_number;
    courses.push({
      'subject': subject,
      'catalog_number': catalog_number
    });
  });
  // sort courses alphanumerically
  courses.sort((a, b) =>
  (a.subject < b.subject || ((a.subject == b.subject) && a.catalog_number < b.catalog_number)) ? -1 : 1);

  const json = JSON.stringify(courses);
  fs.writeFile(COURSE_LIST, json, err => {
    if (err) {
      console.error(err);
      callback(1, null);
    }
    callback(0, json);
  });
}

// reset data file of objects
function resetData (res, callback) {
  var sorted_courses = [];
  res.forEach(course => {
    const subject = course.subject;
    const catalog_number = course.catalog_number;

    const index = indexInArray (subject, sorted_courses);
    if (index == -1) sorted_courses.push([subject, [catalog_number]]);
    else sorted_courses[index][1].push(catalog_number);
  });

  // sort courses alphanumerically
  sorted_courses.sort((a,b) => (a[0] < b[0]) ? -1 : 1);
  sorted_courses.forEach(course => course[1].sort((a,b) => (a < b) ? -1 : 1));

  // Convert array to object
  sorted_courses = sorted_courses.reduce((a,b) => {
    const obj = {};
    b[1].forEach(cat_num => {
      obj[cat_num] = {
        "prereqs": [],
        "coreqs": [],
        "antireqs": []
      };
    });
    a[b[0]] = obj;
    return a;
  }, {});

  var sorted_json = JSON.stringify(sorted_courses);

  fs.writeFile(DATA, sorted_json, 'utf8', err => {
    if(err) {
      console.error(err);
      return callback(1, null);
    }
    console.log(sorted_json);
    callback(0, sorted_json);
  });
}

function updateTree(tree, callback) {
  const json = JSON.stringify(tree);
  fs.writeFile(TREE, json, 'utf8', err => {
    if(err) {
      console.error(err);
      return callback(1, null);
    }
    console.log("Tree updated successfully.");
    callback(0, json);
  });
}

// fill out data set with requisites
function fillEntries (callback) {
  fs.readFile(COURSE_LIST, 'utf8', (err, cl_data) => {
    if (err) {
      console.error(err);
      return callback(err, null);
    }
    fs.readFile(DATA, 'utf8', (err, d_data) => {
      const course_list = JSON.parse(cl_data);  // list of sorted courses
      const data = JSON.parse(d_data); // data object of courses

      async.eachLimit(course_list, 50, function (course, callback1) {
        const subject = course.subject;
        const catalog_number = course.catalog_number;
        waterloo.getPrereqs(subject, catalog_number, (err, res) => {
          if (err || !res) return callback1();
          data[subject][catalog_number]["prereqs"] = res;
          console.log(subject + catalog_number + ", res: " + res);
          callback1();
        });
      }, function (err) {
        const data_json = JSON.stringify(data);
        fs.writeFile(DATA, data_json, 'utf8', (err) => {
          if (err) {
            console.error(err);
            return callback(err, null);
          }
          console.log(DATA + " filled.");
          callback(null, data_json);
        });
      })
    });
  });
}

// checks if subject is in arr.  Returns -1 if false
function indexInArray (subject, arr) {
  for (var i = 0; i < arr.length; i++){
    if (arr[i][0] == subject) return i;
  }
  return -1;
}

function getJSON(filepath, callback) {
  fs.readFile(filepath, 'utf8', (err, data) => {
    if(err) {
      console.error(err);
      callback(err, null)
    }
    const json_data = JSON.parse(data);
    callback(null, json_data);
  });
}

module.exports = {
  COURSE_LIST,
  DATA,
  updateCourseList,
  resetData,
  fillEntries,
  getJSON,
  updateTree
}
