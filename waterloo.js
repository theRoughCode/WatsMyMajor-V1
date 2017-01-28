var watApi = require('uwaterloo-api');
var fs = require('fs');
var async = require('async');

// Enable hiding of API Key
require('dotenv').config();;

// instantiate client
var uwclient = new watApi({
  API_KEY : process.env.API_KEY
})


function getReqsGraph () {
  uwclient.get('/courses.json', function (err, res) {
    const courses = [];
    if(err) console.error(err);

    res.data.forEach(course => {
      const course_code = course.subject + course.catalog_number;

      async.waterfall([function(callback) {
        const subject = course.subject;
        const course_number = course.catalog_number;
        getPrereqs(subject, course_number, reqs => callback(null, subject, course_number, reqs));
      }, function (subject, course_number, prereqs, callback){
        getCoreqs(subject, course_number, reqs => callback(null, subject, course_number, prereqs, reqs));
      }, function (subject, course_number, prereqs, coreqs, callback) {
        getAntireqs(subject, course_number, reqs => callback(null, prereqs, coreqs, reqs));
      },
      function (prereqs, coreqs, antireqs, callback) {
        courses.push({
          'course_code': course_code,
          'prereqs': prereqs,
          'antireqs': antireqs,
          'coreqs': coreqs
        });
        callback(null, null);
      }], function (err, results) {
        if (err) console.error(err);
        console.log(courses);
      });
      // sort courses alphanumerically
      courses.sort((a, b) => (a.course_code < b.course_code) ? -1 : 1);
      //console.log(courses);
      })
    });
}

// Use API
function getPrereqs (subject, course_number, callback) {
  uwclient.get(`/courses/${subject}/${course_number}/prerequisites.json`, function(err, res){
     if(err) console.error(err);
     const course = res.data.subject + ' ' + res.data.catalog_number + ' - ' + res.data.title;
     const prereqs = res.data.prerequisites_parsed;
     callback(prereqs);
     /*const mandatory_courses = [];
     prereqs.forEach(elem => {
       if(elem instanceof Array) {
         const pick = elem[0];
         console.log("Choose " + pick + " of:");
         elem = elem.slice(1);
         elem.forEach(function(elem) {
           console.log("   " + elem);
         });
       }
       else {
         mandatory_courses.push(elem);
       }
     });
     console.log("Must take the following courses:");
     mandatory_courses.forEach(course => console.log("   " + course));
     return prereqs;
   });*/
 })
}

function getAntireqs (subject, course_number, callback) {
  console.log(subject, course_number);
  uwclient.get(`/courses/${subject}/${course_number}.json`, function(err, res){
    if(err) console.error(err);
    var antireqs = res.data.antirequisites;
    if(antireqs !== null) antireqs = antireqs.replace(/\s+/g,'').split(',');
    callback(antireqs);
  })
}

function getCoreqs (subject, course_number, callback) {
  uwclient.get(`/courses/${subject}/${course_number}.json`, function(err, res){
    if(err) console.error(err);
    var coreqs = res.data.corequisites;
    if (coreqs === null) callback(null);
    var num = coreqs.slice(0, 3);
    switch(num) {
      case 'One':
        num = '1';
        break;
      case 'Two':
        num = '2';
        break;
      case 'Three':
        num = '3';
        break;
      default:
        console.error("Error reading corequisites");
    }
    coreqs = coreqs.slice(7,-1).replace(/\s+/g,'').split(',');
    coreqs.unshift(num);
    callback(coreqs);
  })
}

getReqsGraph();

// Exports
module.exports = {
  getPrereqs
}
