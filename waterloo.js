var watApi = require('uwaterloo-api');
var fs = require('fs');
var async = require('async');

// Enable hiding of API Key
require('dotenv').config();

// filename for courses json file
const filename = 'courses.json';

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
  async.parallel([
    callback => getPrereqs(subject, course_number, reqs => callback(null, reqs)),
    callback => getCoreqs(subject, course_number, reqs => callback(null, reqs)),
    callback => getAntireqs(subject, course_number, reqs => callback(null, reqs)),
    callback => getCrosslistings(subject, course_number, reqs => callback(null, reqs)),
    callback => getTermsOffered(subject, course_number, reqs => callback(null, reqs))
  ], function(err, results) {
    if(err) console.error(err);
    var string = ("Course: " + subject + course_number + "\nPrerequisites:\n");
    // Prerequisites
    results[0].forEach(elem => {
      if (typeof elem[0]== 'number') string += pick(elem);
      else string += ("   " + elem + "\n");
    });
    // Corequisites
    string += ("\nCorequisites:\n");
    if (Array.isArray(results[1]))
      results[1].forEach(coreq => string += ("   " + coreq + "\n"));
    else string += ("   " + results[1] + "\n");
    // Antirequisites
    string += ("\nAntirequisites:\n");
    if(Array.isArray(results[2]))
      results[2].forEach(antireq => string += ("   " + antireq + "\n"));
    else string += ("   " + results[2]);
    // Cross Listings
    string += ("\nCross Listings:\n");
    results[3].forEach(cl => string += ("   " + cl + "\n"));
    // Terms Offered
    string += ("\nTerms Offered:\n");
    results[4].forEach(term => string += ("   " + term + "\n"));
    console.log(string);
    results.push(string);
    callback(results);
  });
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

function getAntireqs (subject, course_number, callback) {
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
    if (coreqs !== null) {
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
    }
    callback(coreqs);
  })
}

function getCrosslistings(subject, course_number, callback) {
  uwclient.get(`/courses/${subject}/${course_number}.json`, function(err, res){
    if(err) console.error(err);
    var crosslistings = res.data.crosslistings;
    crosslistings = crosslistings.replace(/\s+/g,'').split(',');
    callback(crosslistings);
  });
}

function getTermsOffered(subject, course_number, callback) {
  uwclient.get(`/courses/${subject}/${course_number}.json`, function(err, res){
    if(err) console.error(err);
    var terms = res.data.terms_offered;
    callback(terms);
  });
}

function getCourses() {
  uwclient.get('/courses.json', function (err, res) {
    const courses = [];
    res.data.forEach(course => courses.push({
      'subject': course.subject,
      'catalog_number': course.catalog_number
    }));
    // sort courses alphanumerically
    courses.sort((a, b) => (a.course < b.course) ? -1 : 1);
    console.log(courses);

    var json = JSON.stringify(courses);
    fs.writeFile(filename, json, 'utf8', (err) => {
      if(err) console.error(err);
      console.log('File saved.');
    })
  });
}

// Exports
module.exports = {
  getRequisites
}
