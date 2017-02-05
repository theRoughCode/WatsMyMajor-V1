const data = require('../../data.json');

module.exports = (req, res) => {
  res.status(200).json(data);
};
