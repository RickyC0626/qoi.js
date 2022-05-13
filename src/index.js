const { encode } = require('./encoder');
const { decode } = require('./decoder');

const QOI = { encode, decode };

module.exports = { QOI };