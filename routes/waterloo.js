const watApi = require('uwaterloo-api');
const fs = require('fs');
const async = require('async');
const data = require('./models/data');

// Enable hiding of API Key
require('dotenv').config();

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

// Use API
function getReqInfo(subject, course_number, callback) {
  getDataReqs(subject, course_number, reqs =>
    uwclient.get(`/courses/${subject}/${course_number}.json`, function(err, res){
       if(err) console.error(err);
       const course = subject + ' ' + course_number + ' - ' + res.data.title;
       const description = res.data.description;
       var prereqs = reqs.prereqs;
       var coreqs = (reqs.coreqs) ? reqs.coreqs.join() : null;
       var antireqs = reqs.antireqs;
       if (coreqs !== null) {
         // Edge case of "Oneof"
         if(coreqs.includes("of")){
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
           coreqs = coreqs.slice(5,-1).replace(/\s+/g,'').split(',');
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
       if(prereqs && prereqs[0] === 1) {
         let temp = [prereqs[0]];
         prereqs.slice(1).forEach(elem => {
           if(Array.isArray(elem)) temp = temp.concat(elem.slice(1));
           else temp = temp.concat(elem);
         });
         prereqs = temp;
       }
       if(Array.isArray(prereqs)){
         // if first elem is a digit
         if(!isNaN(prereqs[0])) prereqsString.push(pick(prereqs));
         else {
           prereqs.forEach(prereq => {
             if (typeof prereq[0] == 'number') prereqsString.push(pick(prereq));
             else prereqsString.push(prereq);
           });
         }
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

// Gets prerequisites from UW-API
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

//  Gets requisites from UW-API
// returns object with prereqs, coreqs, and antireqs
function getReqs(subject, course_number, callback) {
  getPrereqs(subject, course_number, (err, prereqs) => {
    if(err) return callback(err, null);
    // for courses that don't have prereqs
    if(prereqs === 'undefined' || !prereqs) prereqs = null;

    uwclient.get(`/courses/${subject}/${course_number}.json`, (err, res) => {
      if(err) return callback(err, null);
      var coreqs, antireqs;
      if ((coreqs = res.data.corequisites)) {
        coreqs = coreqs.replace(/\s+/g, '').split(',');
        // add course subject for those without
        coreqs.forEach((coreq, index) => {
          if(!isNaN(coreq.charAt(0)))
            coreqs[index] = coreqs[index - 1].replace(/[0-9]/g, '') + coreq;
        });
      }
      if ((antireqs = res.data.antirequisites)) {
        // remove whitespace and split by comma
        antireqs = antireqs.replace(/\s+/g, '').split(',');
        // add course subject for those without
        antireqs.forEach((antireq, index) => {
          if(!isNaN(antireq.charAt(0)) && index > 0)
            antireqs[index] = antireqs[index - 1].replace(/[0-9]/g, '') + antireq;
        });
      }

      return callback(null, {
        prereqs: prereqs,
        coreqs: coreqs,
        antireqs: antireqs
      });
    });
  });
}

// Gets courses from UW-API
function getCourses (callback) {
  uwclient.get('/courses.json', function (err, res) {
    if (err) console.error(err);
    callback(res);
  })
}


// --------------------- DATA FROM JSON ----------------------------

function getDataReqs(subject, cat_num, callback) {
  data.getJSON(data.DATA, (err, json) => {
    if(err) return callback(null);
    callback(json[subject][cat_num]);
  });
}

// returns [{courses that requires this as prereq}, {courses that requires
//    this as coreq}]
function getParentReqs(subject, cat_num, callback) {
  data.getJSON(data.DATA, (err, json) => {
    if(err) return callback(null);

    const course = subject + cat_num;
    const filtered = [[], []];
    const keys = Object.keys(json);
    var keysLeft = keys.length;

    if (keysLeft === 0) return callback(null);
    keys.forEach(subject => {
      data.filter(json[subject], [
        val => {
          if(!val.prereqs) return false;

          var prereqs = val.prereqs;

          if (Array.isArray(val.prereqs)){
            var chooseOne = (!isNaN(prereqs[0]) || typeof prereqs[0] === 'number');  // true if choose one
            prereqs.forEach((elem, index) => {
              // choose 1
              if (Array.isArray(elem)) {
                prereqs[index] = elem.join();
                // if course is among choose 1
                if(prereqs[index].includes(course)){
                  val.prereqs["optional"] = true;
                  return true;
                }
              } else if(elem === course) {  // Mandatory prereq
                if(chooseOne) {
                  const regStr = eval(`/${elem.slice(0, -2)}[0-9]${elem.slice(-1)}/i`);

                  // > -1 if advanced course is available
                  var alt_index = prereqs.indexOf(regStr);
                  prereqs.forEach(req => {
                    if(req !== elem && regStr.test(req)) {
                      val.prereqs["alternate"] = prereqs[index + 1];
                      val.prereqs["optional"] = false;
                    }
                  });
                  if (!val.prereqs["alternate"]) val.prereqs["optional"] = true;
                }
                return true;
              }
            });
            prereqs = prereqs.join();
          }
          if(val.prereqs['optional']) return true;

          if(prereqs.includes(course)) {
            val.prereqs["optional"] = false;
            return true;
          } else return false;
        },
        val => {
          if(!val.coreqs) return false;

          var coreqs = val.coreqs;
          if (Array.isArray(val.coreqs)){
            coreqs.forEach((elem, index) => {
              // choose 1
              if (Array.isArray(elem)) {
                coreqs[index] = elem.join();
                // if course is among choose 1
                if(coreqs[index].includes(course)){
                  val.coreqs["optional"] = true;
                  return true;
                }
              }
              if(elem.includes(course)) {  // Mandatory coreq
                // optional if only course is specified
                val.coreqs["optional"] = (elem.includes('or'));
                return true;
              }
            });
            coreqs = coreqs.join();
          }
          if(val.coreqs['optional']) return true;

          if(coreqs.includes(course)) {
            val.coreqs["optional"] = false;
            return true;
          } else return false;
      }], sub_list => {
        // has this course as prereq
        if(sub_list[0]) {
          const courses = Object.keys(sub_list[0]);
          courses.forEach(key => {
            filtered[0].push({
              subject: subject,
              cat_num: key,
              optional: sub_list[0][key]['prereqs']['optional'],
              alternate: sub_list[0][key]['prereqs']['alternate'] || null
            });
          });
        }
        // has this course as coreq
        if(sub_list[1]) {
          const courses = Object.keys(sub_list[1]);
          courses.forEach(key => {
            filtered[1].push({
              subject: subject,
              cat_num: key,
              optional: sub_list[1][key]['coreqs']['optional']
            });
          });
        }
      })
      if (--keysLeft === 0) return callback(filtered);
    });
  });
}

// Exports
module.exports = {
  getCourseInfo,
  getReqInfo,
  getCourses,
  getPrereqs,
  getReqs,
  getDataReqs,
  getParentReqs
}
