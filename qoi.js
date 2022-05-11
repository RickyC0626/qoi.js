const { encode } = require('./encode');

const image = new Uint8Array(3);
image[0] = 255;
image[1] = 255;
image[2] = 255;

const qoif = encode(image, {
  width: 1,
  height: 1,
  channels: 3,
  colorSpace: 1,
});

console.log(qoif);