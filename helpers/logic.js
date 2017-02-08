const data = require('../routes/models/data');

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

  acc.each(set => {

  });
  callback(acc);
}

module.exports = {
  getPrereqs
}
