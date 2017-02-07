const fs = require('fs');
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
  updateData
}
