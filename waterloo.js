var watApi = require('uwaterloo-api');
var fs = require('fs');

// Enable hiding of API Key
require('dotenv').config();;

// instantiate client
var uwclient = new watApi({
  API_KEY : process.env.API_KEY
})

uwclient.get('/courses.json', function (err, res) {
  const courses = [];
  res.data.forEach(course => {
    const course_code = course.subject + course.catalog_number;
    const course_title = course.title;
    courses.push({
      'course_code': course_code,
      'course_title': course_title
    });
  });
  // sort courses alphanumerically
  courses.sort((a, b) => (a.course_code < b.course_code) ? -1 : 1);
  console.log(courses);
})
function getReqsGraph () {
  // body...
}

// Use API
function getPrereqs (subject, course_number) {
   return uwclient.get(`/courses/${subject}/${course_number}/prerequisites.json`,
   function(err, res){
     const course = res.data.subject + ' ' + res.data.catalog_number + ' - ' +
                    res.data.title;
     const prereqs = res.data.prerequisites_parsed;
     const mandatory_courses = [];
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
   });
}

// Exports
module.exports = {
  getPrereqs
}
