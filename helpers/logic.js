const data = require('../routes/models/data');
const async = require('async');
const deprec_courses = [
  "CHEM256", "MATH108", "MATH125"
]

function test (callback) {
  data.getData(data.DATA, (err, res) => {
    if(err) {
      console.error(err);
      return callback(err, null);
    }
    callback(null, res);
  });
}

// returns all courses needed to take
function getPrereqs (subject, cat_num, callback) {
  data.getJSON(data.DATA, (error, res) => {
    retrievePrereqs(subject, cat_num, res, (err, str) => callback(err, str));
  });
}

// returns prereqs of course (err, string)
function retrievePrereqs (subject, cat_num, dataset, callback) {
  // course doesn't exist
  if (!dataset[subject][cat_num])
    return callback(1, null);
  // course has been deprecated
  if(deprec_courses.indexOf(subject + cat_num) > -1)
    return callback(2, null);
  const prereqs = dataset[subject][cat_num]["prereqs"];
  if(prereqs.length === 0) return callback(3, null);
  console.log(prereqs);

  dataToString(prereqs, dataset, string => callback(null, string));
}

// return (String)
function dataToString (val, dataset, callback) {
  const val_type = typeof(val);
  var string = "";
  if (val_type === "string") {
    // inserts white space between numbers and letters
    const re_space = /[^0-9\s](?=[0-9])/g;
    val = val.replace(re_space, '$& ');
    const arr = val.split(" ");
    const subject = arr[0];
    const cat_num = arr[1];
    retrievePrereqs(subject, cat_num, dataset, (err, str) => {
      if (err) {
        // if no prereqs
        if(err === 3) return callback(val);
        return callback(val);
      }
      console.log("str", str);
      val += " [" + str + "]";
      console.log("obj", val);
      return callback(val);
    });
  }
  else if (Array.isArray(val)) {
    // [1, "course 1", "course 2"]
    if (typeof(val[0]) === "number") {
      string += "Choose " + val[0] + " of: ";
      async.eachSeries(val.slice(1), function (elem, callback1) {
        dataToString(elem, dataset, res => {
          string += res + ", ";
          callback1();
        })
      }, err => {
        if(err) console.error(err);
        string = string.slice(0, -2);
        return callback(string);
      })
    }
    // ["course 1", "course 2"]
    else {
      const start_string = "All of: [";
      string += start_string;
      async.eachSeries(val, function (elem, callback1) {
        dataToString(elem, dataset, res => {
          string += res + ", ";
          return callback1();
        });
      }, err => {
        if (err) console.error(err);
        // remove trailing ", "
        if (string === start_string) return callback("");
        string = string.slice(0, -2);
        string += "]";
        console.log("str: ", string);
        return callback(string);
      })
    }
  } else {
    console.log("ERROR: This should not be running.");
    callback(null);
  }
}

module.exports = {
  getPrereqs
}
