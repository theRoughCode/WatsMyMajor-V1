const fs = require('fs');
const waterloo = require('../waterloo');
const async = require('async');
const COURSE_LIST = './course_list.json';
const DATA = './data.json';

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
  (a.subject < b.subject && a.catalog_number < b.catalog_number) ? -1 : 1);

  const json = JSON.stringify(courses);
  writeFile(COURSE_LIST, json, err => {
    if (err) {
      console.error(err);
      callback(1, null);
    }
    callback(0, json);
  });
}

function updateData (res, callback) {
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

  fs.writeFile(DATA, sorted_json, 'utf8', (err) => {
    if(err) {
      console.error(err);
      callback(0, null);
    }
    console.log(DATA + ' saved.');
    callback(1, sorted_json);
  });
}

var last_course_queried = "";
var result = {};

function fill (callback) {
  fs.readFile(COURSE_LIST, 'utf8', (err, data) => {
    if (err) return console.error(err);
    const courses = JSON.parse(data);
    async.eachLimit(courses, 10, function (course, callback1) {
      const subject = course.subject;
      const catalog_number = course.catalog_number;
      waterloo.getPrereqs(subject, catalog_number, (err, res) => {
        if (err) return callback1();
        console.log(subject + catalog_number + ", res: " + res);
        if(res)result[subject + catalog_number] = res;
        callback1();
      });
    }, function (err) {
      console.log(result);
      callback(null, result);
    })
  });
}

function fillEntries (callback) {
  var error = false;

  fs.readFile(DATA, 'utf8', (err, data) => {
    if(err) return console.error(err);
    var courses = JSON.parse(data);

    var size = 0;
    for (subject in courses){
      size += Object.keys(subject).length;
    }

    var counter = 0;
    var tasks_active = 0;

    /*Object.keys(courses).forEach(subject => {
      if(counter >= size) throw BreakException;
      Object.keys(courses[subject]).forEach(cat_num => {
        if(tasks_active){
          setTimeout()
        }
        tasks_active++;
        if(courses[subject][cat_num]["prereqs"].length != 0) return;
        waterloo.getPrereqs(subject, cat_num, res => {
          if(!res || res == 1) return callback(1, courses);
          courses[subject][cat_num]["prereqs"] = res;
          console.log(subject, cat_num, res);
          counter++;
          if(counter >= size) return callback(null, courses);
        })
      });
    });*/

    /*var size = 0;
    for (subject in courses){
      size += Object.keys(subject).length;
    }

    var counter = 0;
    var end = false;

    for (subject in courses){
      if (end) {
        callback(courses);
        break;
      }
      for (cat_num in courses[subject]){
        if(end) break;
        waterloo.getPrereqs(subject, cat_num, res => {
          //console.log(res);
          if (!res || end) return;
          if (res === 1) {
            console.error("Error!");
            end = true;
            return;
          }
          console.log(subject, cat_num, res);
          courses[subject][cat_num]["prereqs"] = res;
          if (counter >= size) {
            callback(courses);
          }
          counter++;
        })
      }
    }*/

    const asyncTasks = [];

    /*async.forEachOf(courses, function (cat_num_obj, subject, callback1) {
      async.forEachOf(cat_num_obj, function (value, cat_num, callback2) {
        asyncTasks.push(function (callback3) {
          waterloo.getPrereqs(subject, cat_num, res => {
            const prereqs = res;
            if(prereqs) courses[subject][cat_num]["prereqs"] = prereqs;
            console.log(subject, cat_num);
            callback3();
          });
        });
        async.setImmediate(() => callback2());
      }, err =>  {
        callback1();
      });
    }, err => {
      async.parallel(asyncTasks, () => {
        console.log(courses);
        callback(null, courses);
      })
    });*/



    /*async.forEachOf(courses, function (cat_num_obj, subject, callback1) {
      if(error) return callback1();
      async.forEachOf(cat_num_obj, function (value, cat_num, callback2) {
        if(error) return callback2();
        if (value.prereqs.length != 0)
          return callback2();
        waterloo.getPrereqs(subject, cat_num, res => {
          if(res === 1) {
            //console.error(res);
            console.log(last_course_queried);
            console.log("error: "+error);
            if(true) return;
            error = true;
            console.log("error2: "+error);
            return callback2(res);
          }
          else {
            const prereqs = res;
            if(prereqs)courses[subject][cat_num]["prereqs"] = prereqs;
            last_course_queried = [subject, cat_num];
            console.log(error);
            console.log(subject, cat_num);
            callback2();
          }
        });
      }, function(err) {
        if(err) {
          console.log("asdsadasd");
          return callback1(err);
        }
        callback1();
      })
    }, function(err) {
      if(err) {
        console.error("assa "+err);
        //console.log(last_course_queried);
        return callback(err);
      }
      console.log("hi");
      callback("courses");
    });*/
  });
}

// checks if subject is in arr.  Returns -1 if false
function indexInArray (subject, arr) {
  for (var i = 0; i < arr.length; i++){
    if (arr[i][0] == subject) return i;
  }
  return -1;
}

// Writes to File. Returns 0 if successful, and 1 if unsuccessful
function writeFile (filepath, data, callback) {
  fs.writeFile(filepath, data, 'utf8', (err) => {
    if(err) {
      console.error(err);
      callback(1);
    }
    console.log(filepath + ' saved.');
    callback(0);
  });
}

function getData(filepath, callback) {
  fs.readFile(filepath, 'utf8', (err, data) => {
    if(err) return console.error(err);
    const json_data = JSON.parse(data);
    callback(json_data);
  });
}

module.exports = {
  COURSE_LIST,
  DATA,
  updateCourseList,
  updateData,
  fillEntries,
  fill
}
