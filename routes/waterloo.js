const watApi = require('uwaterloo-api');
const fs = require('fs');
const async = require('async');

// Enable hiding of API Key
require('dotenv').config();

// filename for courses json file
const course_list_filename = './course_list.json';
const sorted_data_filename = './sorted.json';
const TERM = '1175';  // Spring 2017, 1179 = Fall 2017
// instantiate client
var uwclient = new watApi({
  API_KEY : process.env.API_KEY
})

function getCourseInfo(subject, cat_num, callback) {
  uwclient.get(`/terms/${TERM}/${subject}/${cat_num}/schedule.json`, function(err, res) {
    if(err) return callback(null);
    if (res.data.length === 0) return callback(null);
    //console.log(res.data[0].subject + res.data[0].catalog_number);

    const units = res.data[0].units;
    const title = res.data[0].title;

    const classes = [];
    res.data.forEach(course => {
      const info = {
        class_number: course.class_number,
        enrol_cap: course.enrollment_capacity,
        enrol_total: course.enrollment_total,
        wait_cap: course.waiting_capacity,
        wait_total: course.waiting_total,
        days: course.classes[0].date.weekdays,
        start_time: course.classes[0].date.start_time,
        end_time: course.classes[0].date.end_time,
        instructors: course.classes[0].instructors,
        is_cancelled: course.classes[0].date.is_cancelled,
        is_closed: course.classes[0].date.is_closed,
        building: course.classes[0].location.building,
        room: course.classes[0].location.room
      };
      classes.push(info);
    });
    const data = {
      units: units,
      title: title,
      term: TERM,
      classes: classes
    }
    return callback(data);
  });
}

function getReqsGraph() {
  fs.readFile(filename, 'utf8', (err, data) => {
    if(err) return console.error(err);
    var courses = JSON.parse(data);
    async.each(courses, function(course, callback){
      getRequisites(course.subject, course.catalog_number, function(requisites) {
        course.prereqs = requisites[0];
        course.coreqs = requisites[1];
        course.antireqs = requisites[2];
        console.log(requisites[0]);
        callback();
      });
    }, err => {
      if(err) return console.error(err);
      console.log(courses);
    });
  });
}

// Use API
function getRequisites(subject, course_number, callback) {
  getPrereqs(subject, course_number, (err, prereqs) =>
    uwclient.get(`/courses/${subject}/${course_number}.json`, function(err, res){
       console.log(res.data.url);
       if(err) console.error(err);
       const course = subject + ' ' + course_number + ' - ' + res.data.title;
       const description = res.data.description;
       var antireqs = res.data.antirequisites;
       if(antireqs !== null) {
         antireqs = antireqs.replace(/\s+/g,'').split(',');
         console.log(antireqs);
         antireqs.forEach((elem, index) => {
           if(!isNaN(elem.charAt(0))) {
             antireqs[index - 1] = antireqs[index - 1] + ", " + elem;
             antireqs.splice(index, 1);
           }
         });
       }
       var coreqs = res.data.corequisites;
       if (coreqs !== null) {
         if(coreqs.includes(" of ")){
           var num = coreqs.slice(0, 3);
           switch(num) {
             case 'One':
             num = 1;
             break;
             case 'Two':
             num = 2;
             break;
             case 'All':
             num = null;
             break;
             default:
             console.error("Error reading corequisites");
           }
           coreqs = coreqs.slice(7,-1).replace(/\s+/g,'').split(',');
           coreqs.unshift(num);
         } else {
           coreqs = coreqs.replace(/or/g,', ').split(',');
         }
       }
       var crosslistings = res.data.crosslistings;
       var terms = res.data.terms_offered;

       //OUTPUT STRING
       const prereqsString = [];
       // Prerequisites
       if(Array.isArray(prereqs)){
         prereqs.forEach(prereq => {
           if (typeof prereq[0] == 'number') prereqsString.push(pick(prereq));
           else prereqsString.push(prereq);
         });
       } else prereqsString.push(prereqs);

       // Corequisites
       const coreqsString = [];
       if (Array.isArray(coreqs)) {
         if (typeof coreqs[0] == 'number') coreqsString.push(pick(coreqs));
         else coreqs.forEach(coreq => coreqsString.push(coreq));
       } else coreqsString.push(coreqs);

       const data = {
         course: course,
         description: description,
         prereqs: prereqs,
         antireqs: antireqs,
         coreqs: coreqs,
         crosslistings: crosslistings,
         terms: terms,
         string: {
           prereqs: prereqsString,
           coreqs: coreqsString
         },
         subject: subject,
         catalog_number: course_number,
         url: res.data.url
       }
       callback(data);
     })
  );
}

// handles Choose One event
function pick (arr) {
  var string = "";
  var num = arr[0];
  string += ("   Choose " + num + " of:\n");
  arr.slice(1).forEach(elem => {
    if (typeof elem[0] === 'number'){
      num = elem[0];
      string += ("      Choose " + num + " of:\n");
      elem.slice(1).forEach(elem2 => string += (", " + elem2));
    }
    else if (Array.isArray(elem)) {
      string += ("All of: [" + elem + "]\n");
    }
    else string += ("" + elem + ",\n");
  });
  return string.slice(0, -2);
}

function getPrereqs (subject, course_number, callback) {
  uwclient.get(`/courses/${subject}/${course_number}/prerequisites.json`, function(err, res){
     if(err) {
       console.error(err);
       return callback(err, null);
     }
     if (!res) {
       console.log("Undefined prereqs");
       return callback(1, null);
     }
     const prereqs = res.data.prerequisites_parsed;

   callback(null, prereqs);
 })
}

function getCourses (callback) {
  uwclient.get('/courses.json', function (err, res) {
    if (err) console.error(err);
    callback(res);
  })
}

// Exports
module.exports = {
  getCourseInfo,
  getRequisites,
  getCourses,
  getPrereqs
}
