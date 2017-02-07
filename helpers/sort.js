const waterloo = require('../routes/waterloo');
const data = require('../routes/models/data');

function test () {
  data.getData(data.COURSE_LIST);
}

module.exports = {
  test
}
