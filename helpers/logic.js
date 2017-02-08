const data = require('../routes/models/data');
const async = require('async');

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
function getPrereqs (course, subject, callback) {
  data.getJSON(data.DATA, (error, res) => {
    retrievePrereqs(course, subject, res, [], acc => callback(null, acc));
  });
}

// returns prereqs of course
function retrievePrereqs (course, subject, dataset, acc, callback) {
  const prereqs = dataset[course][subject]["prereqs"];
  acc = acc.concat(prereqs);
  /*async.each(acc, function (set, callback1) {
    if(typeof(set) === "string") {
      // inserts white space between numbers and letters
      const re_space = /[^0-9\s](?=[0-9])/g;
      set = set.replace(re_space, '$& ');
      var arr = set.split(" ");
      console.log(arr);
      //retrievePrereqs()
      callback1();
    }
    else if (Array.isArray(set)) {
      if (typeof(set[0]) === "number") {
        const result = set.slice(1).reduce((a,b) => {
          if (typeof(b) === "string") return a + ", " + b;
          else if (Array.isArray(b)) {
            if (typeof(b[0]) === "number")
              return a + ", Choose " + b[0] + " of: " + b.slice(1).join();
            else return a + ", all of [" + b.join() + "]";
          } else{
            console.log("ERROR: This shouldn't happen");
            return a;
          }
        }, "");

        console.log("Choose " + set[0] + " of: " + result);
      } else console.log("Take all of " + set.toString());
    }
  }, function (err) {

  });*/
  dataToString(acc, string => {
    callback(string);
  });
}

// return (String)
function dataToString (val, callback) {
  const val_type = typeof(val);
  var string = "";
  if (val_type === "string") {
    // inserts white space between numbers and letters
    const re_space = /[^0-9\s](?=[0-9])/g;
    val = val.replace(re_space, '$& ');
    return callback(val);
  }
  else if (Array.isArray(val)) {
    // [1, "course 1", "course 2"]
    if (typeof(val[0]) === "number") {
      string += "Choose " + val[0] + " of: ";
      async.eachSeries(val.slice(1), function (elem, callback1) {
        dataToString(elem, res => {
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
      string += "All of: [";
      async.eachSeries(val, function (elem, callback1) {
        dataToString(elem, res => {
          string += res + ", "
          callback1();
        });
      }, err => {
        if (err) console.error(err);
        // remove trailing ", "
        string = string.slice(0, -2);
        string += "]";
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
