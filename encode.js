const {
  QOI_HEADER_SIZE,
  QOI_END_MARKER_SIZE,
  QOI_MAGIC_Q,
  QOI_MAGIC_O,
  QOI_MAGIC_I,
  QOI_MAGIC_F,
  QOI_OP_INDEX,
  QOI_OP_DIFF,
  QOI_OP_LUMA,
  QOI_OP_RUN,
  QOI_OP_RGB,
  QOI_OP_RGBA,
  QOI_SRGB,
  QOI_LINEAR,
  QOI_CHANNEL_RGB,
  QOI_CHANNEL_RGBA,
  QOI_MASK,
  MAX_INT32,
} = require('./constants');

/**
 * Encode a QOI file
 *
 * @param {Uint8Array|Uint8ClampedArray} colorData Array containing color of each pixel in the image
 * @param {object} header QOI header
 * @param {int} header.width Image width in pixels (32-bit Big Endian)
 * @param {int} header.height Image height in pixels (32-bit Big Endian)
 * @param {int} header.channels Number of channels the image has (3 = RGB, 4 = RGBA)
 * @param {int} header.colorSpace Colorspace used in image (0: sRGB with linear alpha, 1: linear)
 *
 * @returns {ArrayBuffer} ArrayBuffer containing QOI file contents
 */
const encode = (colorData, header) => {
  const width = header.width;
  const height = header.height;
  const channels = header.channels;
  const colorSpace = header.colorSpace;

  // Previous pixel value to start with
  let red = 0, green = 0, blue = 0, alpha = 255;
  let prevRed = red, prevGreen = green, prevBlue = blue, prevAlpha = alpha;

  const pixelLength = width * height * channels;
  const pixelEnd = pixelLength - channels;

  if(width < 0 || width >= MAX_INT32)
    throw new Error('QOI[Encode]: Invalid header.width, must be within range of a 32-bit integer');
  if(height < 0 || height >= MAX_INT32)
    throw new Error('QOI[Encode]: Invalid header.height, must be within range of a 32-bit integer');
  if(colorData.constructor.name !== 'Uint8Array' && colorData.constructor.name !== 'Uint8ClampedArray')
    throw new Error('QOI[Encode]: The provided colorData must be an instance of Uint8Array or Uint8ClampedArray!');
  if(colorData.length !== pixelLength)
    throw new Error('QOI[Encode]: The length of colorData is incorrect');
  if(channels !== QOI_CHANNEL_RGB && channels !== QOI_CHANNEL_RGBA)
    throw new Error(`QOI[Encode]: Invalid header.channels, must be ${QOI_CHANNEL_RGB} or ${QOI_CHANNEL_RGBA}`);
  if(colorSpace !== QOI_SRGB && colorSpace !== QOI_LINEAR)
    throw new Error(`QOI[Encode]: Invalid header.colorSpace, must be ${QOI_SRGB} or ${QOI_LINEAR}`);

  let run = 0;
  let p = 0;

  const maxSize = width * height * (channels + 1) + QOI_HEADER_SIZE + QOI_END_MARKER_SIZE;
  const bytes = new Uint8Array(maxSize);
  const index = new Uint8Array(64 * 4);

  // 0 -> 3 : magic "qoif"
  bytes[p++] = QOI_MAGIC_Q;
  bytes[p++] = QOI_MAGIC_O;
  bytes[p++] = QOI_MAGIC_I;
  bytes[p++] = QOI_MAGIC_F;

  // 4 -> 7 : width
  bytes[p++] = (width >> 24) & QOI_OP_RGBA;
  bytes[p++] = (width >> 16) & QOI_OP_RGBA;
  bytes[p++] = (width >> 8) & QOI_OP_RGBA;
  bytes[p++] = width & QOI_OP_RGBA;

  // 8 -> 11 : height
  bytes[p++] = (height >> 24) & QOI_OP_RGBA;
  bytes[p++] = (height >> 16) & QOI_OP_RGBA;
  bytes[p++] = (height >> 8) & QOI_OP_RGBA;
  bytes[p++] = height & QOI_OP_RGBA;

  // 12 : channels
  bytes[p++] = channels;

  // 13 : colorspace
  bytes[p++] = colorSpace;

  for(let pixelPos = 0; pixelPos < pixelLength; pixelPos += channels) {
    red = colorData[pixelPos];
    green = colorData[pixelPos + 1];
    blue = colorData[pixelPos + 2];

    if(channels === 4)
      alpha = colorData[pixelPos + 3];

    if(prevRed === red && prevGreen === green && prevBlue === blue && prevAlpha === alpha){
      run++;

      // Reached maximum run length, or reached end of colorData
      if(run === 62 || pixelPos === pixelEnd) {
        bytes[p++] = QOI_OP_RUN | (run - 1);
        run = 0;
      }
    } else {
      if(run > 0) {
        bytes[p++] = QOI_OP_RUN | (run - 1);
        run = 0;
      }

      const indexPos = ((red * 3 + green * 5 + blue * 7 + alpha * 11) % 64) * 4;

      if(index[indexPos] === red && index[indexPos + 1] === green && index[indexPos + 2] === blue && index[indexPos + 3] === alpha) {
        bytes[p++] = QOI_OP_INDEX | indexPos;
      } else {
        index[indexPos] = red;
        index[indexPos + 1] = green;
        index[indexPos + 2] = blue;
        index[indexPos + 3] = alpha;

        if(alpha === prevAlpha) {
          // Ternary with bitmask handles wraparound
          let dr = red - prevRed;
          dr = dr & QOI_MASK ? (dr - 256) % 256 : (dr + 256) % 256;
          let dg = green - prevGreen;
          dg = dg & QOI_MASK ? (dg - 256) % 256 : (dg + 256) % 256;
          let db = blue - prevBlue;
          db = db & QOI_MASK ? (db - 256) % 256 : (db + 256) % 256;

          const dr_dg = dr - dg;
          const db_dg = db - dg;

          if(dr > -3 && dr < 2 && dg > -3 && dg < 2 && db > -3 && db < 2) {
            bytes[p++] = QOI_OP_DIFF | (dr + 2) << 4 | (dg + 2) << 2 | (db + 2);
          } else if(dr_dg > -9 && dr_dg < 8 && dg > -33 && dg < 32 && db_dg > -9 && db_dg < 8) {
            bytes[p++] = QOI_OP_LUMA | (dg + 32);
            bytes[p++] = (dr_dg + 8) << 4 | (db_dg + 8);
          } else {
            bytes[p++] = QOI_OP_RGB;
            bytes[p++] = red;
            bytes[p++] = green;
            bytes[p++] = blue;
          }
        } else {
          bytes[p++] = QOI_OP_RGBA;
          bytes[p++] = red;
          bytes[p++] = green;
          bytes[p++] = blue;
          bytes[p++] = alpha;
        }
      }
    }
    prevRed = red;
    prevGreen = green;
    prevBlue = blue;
    prevAlpha = alpha;
  }

  // End marker
  for(let i = 0; i < 7; i++)
    bytes[p++] = 0;
  bytes[p++] = 1;

  console.log(bytes);

  return bytes.buffer.slice(0, p);
};

module.exports = { encode };