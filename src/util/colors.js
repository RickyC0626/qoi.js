const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const magenta = '\x1b[35m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

const toColor = (s, color) => color + s + reset;

module.exports = {
  toRed: (s) => toColor(s, red),
  toGreen: (s) => toColor(s, green),
  toYellow: (s) => toColor(s, yellow),
  toBlue: (s) => toColor(s, blue),
  toMagenta: (s) => toColor(s, magenta),
  toCyan: (s) => toColor(s, cyan),
};