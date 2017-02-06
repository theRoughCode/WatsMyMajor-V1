const watApi = require('uwaterloo-api');
const fs = require('fs');
const async = require('async');

// Enable hiding of API Key
require('dotenv').config();

// filename for courses json file
const data_filename = './data.json';
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
  /*uwclient.get('/courses.json', function (err, res) {
    const courses = [];
    if(err) console.error(err);

    res.data.forEach(course => {
      var course_code = course.subject + course.catalog_number;

      async.waterfall([function(callback) {
        const subject = course.subject;
        const course_number = course.catalog_number;
        var prereqs;
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
    });*/
}

// Use API
function getRequisites(subject, course_number, callback) {
  getPrereqs(subject, course_number, prereqs =>
    uwclient.get(`/courses/${subject}/${course_number}.json`, function(err, res){
       if(err) console.error(err);
       const course = res.data.subject + ' ' + res.data.catalog_number + ' - ' + res.data.title;
       const description = res.data.description;
       var antireqs = res.data.antirequisites;
       if(antireqs !== null) {
         antireqs = antireqs.replace(/\s+/g,'').split(',');
         antireqs.forEach((elem, index) => {
           if(!isNaN(elem.charAt(0))) {
             antireqs[index - 1] = antireqs[index - 1] + ", " + elem;
             antireqs.splice(index, 1);
           }
         });
       }
       var coreqs = res.data.corequisites;
       if (coreqs !== null) {
         if(coreqs.slice(3,5) === 'of'){
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
         } else {
           coreqs = coreqs.replace(/or/g,', ');
         }
       }
       var crosslistings = res.data.crosslistings;
       var terms = res.data.terms_offered;

       //OUTPUT STRING
       var string = ("Course: " + subject + course_number + "\nPrerequisites:\n");
       // Prerequisites
       if(Array.isArray(prereqs)){
         prereqs.forEach(elem => {
           if (typeof elem[0]== 'number') string += pick(elem);
           else string += ("   " + elem + "\n");
         });
       } else string += ("   " + prereqs + "\n");
       // Corequisites
       string += ("\nCorequisites:\n");
       if (Array.isArray(coreqs))
         coreqs.forEach(coreq => string += ("   " + coreq + "\n"));
       else string += ("   " + coreqs + "\n");
       // Antirequisites
       string += ("\nAntirequisites:\n");
       if(Array.isArray(antireqs))
         antireqs.forEach(antireq => string += ("   " + antireq + "\n"));
       else string += ("   " + antireqs);
       // Cross Listings
       string += ("\nCross Listings:\n   " + crosslistings + "\n");
       // Terms Offered
       string += ("\nTerms Offered:\n");
       terms.forEach(term => string += ("   " + term + "\n"));
       console.log(string);

       const data = {
         course: course,
         description: description,
         prereqs: prereqs,
         antireqs: antireqs,
         coreqs: coreqs,
         crosslistings: crosslistings,
         terms: terms,
         string: string
       }
       callback(data);
     })
  );
}

function pick (arr) {
  var string = "";
  var num = arr[0];
  string += ("   Choose " + num + " of:\n");
  arr.slice(1).forEach(elem => {
    if (typeof elem[0] === 'number'){
      num = elem[0];
      string += ("      Choose " + num + " of:\n");
      elem.slice(1).forEach(elem2 => string += ("         " + elem2 + "\n"));
    }
    else string += ("      " + elem + "\n");
  });
  return string;
}


function getPrereqs (subject, course_number, callback) {
  uwclient.get(`/courses/${subject}/${course_number}/prerequisites.json`, function(err, res){
     if(err) console.error(err);
     const course = res.data.subject + ' ' + res.data.catalog_number + ' - ' + res.data.title;
     const prereqs = res.data.prerequisites_parsed;
   callback(prereqs);
 })
}

// checks if subject is in arr.  Returns -1 if false
function indexInArray (subject, arr) {
  for (var i = 0; i < arr.length; i++){
    if (arr[i][0] == subject) return i;
  }
  return -1;
}

function getCourses(callback) {
  uwclient.get('/courses.json', function (err, res) {
    const courses = [];
    var sorted_courses = [];
    res.data.forEach(course => {
      const subject = course.subject;
      const catalog_number = course.catalog_number;
      courses.push({
        'subject': subject,
        'catalog_number': catalog_number
      });

      const index = indexInArray (subject, sorted_courses);
      if (index == -1) sorted_courses.push([subject, [catalog_number]]);
      else sorted_courses[index][1].push(catalog_number);
    });
    
    // sort courses alphanumerically
    courses.sort((a, b) => (a.course < b.course) ? -1 : 1);
    sorted_courses.sort((a,b) => (a[0] < b[0]) ? -1 : 1);
    sorted_courses.forEach(course => course[1].sort((a,b) => (a < b) ? -1 : 1));

    // Convert array to object
    sorted_courses = sorted_courses.reduce((a,b) => {
      a[b[0]] = b[1];
      return a;
    }, {});

    var json = JSON.stringify(courses);
    var sorted_json = JSON.stringify(sorted_courses);

    fs.writeFile(data_filename, json, 'utf8', (err) => {
      if(err) {
        console.error(err);
        callback(0);
      }
      console.log(data_filename + ' saved.');
    });

    fs.writeFile(sorted_data_filename, sorted_json, 'utf8', (err) => {
      if(err) {
        console.error(err);
        callback(0);
      }
      console.log(sorted_data_filename + ' saved.');
    });
    callback(1);
  });
}

function getData() {
  fs.readFile(filename, 'utf8', (err, data) => {
    if(err) return console.error(err);
    const courses = JSON.parse(data);
    return courses;
  });
}

// Exports
module.exports = {
  getRequisites,
  getData,
  getCourses
}
