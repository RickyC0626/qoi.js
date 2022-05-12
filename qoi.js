const { encode } = require('./encoder');

const width = 5, height = 5, channels = 3;
const image = new Uint8Array(width * height * channels).fill(200);

try {
  const qoif = encode(image, { width, height, channels, colorspace: 1 });
  console.log(qoif);
}
catch(err) {
  console.log(`[\x1b[32m%s\x1b[0m] \x1b[31m%s\x1b[0m`, 'qoi.js', err.message);
}