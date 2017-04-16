const watApi = require('uwaterloo-api');
const fs = require('fs');
const async = require('async');

// Enable hiding of API Key
require('dotenv').config();

// filename for courses json file
const course_list_filename = './course_list.json';
const sorted_data_filename = './sorted.json';

// instantiate client
var uwclient = new watApi({
  API_KEY : process.env.API_KEY
})

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
  getRequisites,
  getCourses,
  getPrereqs
}
