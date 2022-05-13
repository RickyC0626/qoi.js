const {
  QOI_HEADER_SIZE,
  QOI_END_MARKER,
  QOI_END_MARKER_SIZE,
  MAX_INT32,
  QOI_SRGB,
  QOI_LINEAR,
  QOI_CHANNEL_RGB,
  QOI_CHANNEL_RGBA,
  QOI_MAGIC_BYTES,
  QOI_OP_INDEX,
  QOI_OP_DIFF,
  QOI_OP_LUMA,
  QOI_OP_RUN,
  QOI_OP_RGB,
  QOI_OP_RGBA,
} = require('./constants');

const DIFF_CH_DIFF_LOWER_BOUND_RED = -2;
const DIFF_CH_DIFF_UPPER_BOUND_RED = 1;
const DIFF_CH_DIFF_LOWER_BOUND_GREEN = -2;
const DIFF_CH_DIFF_UPPER_BOUND_GREEN = 1;
const DIFF_CH_DIFF_LOWER_BOUND_BLUE = -2;
const DIFF_CH_DIFF_UPPER_BOUND_BLUE = 1;
const DIFF_CH_DIFF_BIAS = 2;

const LUMA_CH_DIFF_LOWER_BOUND_GREEN = -32;
const LUMA_CH_DIFF_UPPER_BOUND_GREEN = 31;
const LUMA_CH_DIFF_LOWER_BOUND = -8; // Red and blue
const LUMA_CH_DIFF_UPPER_BOUND = 7; // Red and blue
const LUMA_CH_DIFF_BIAS_GREEN = 32;
const LUMA_CH_DIFF_BIAS = 8; // Red and blue

const pixelsMatch = (p1, p2) => {
  if(p1 === undefined || p2 === undefined) return false;

  return (
    p1.r === p2.r &&
    p1.g === p2.g &&
    p1.b === p2.b &&
    p1.a === p2.a
  );
};

const pixelDiff = (p1, p2) => ({
  r: p1.r - p2.r,
  g: p1.g - p2.g,
  b: p1.b - p2.b,
  a: p1.a - p2.a,
});

// Prime numbers to minimize collisions
const hash = ({ r, g, b, a }) => (
  (r * 3 + g * 5 + b * 7 + a * 11) % 64
);

/**
 * Encode a QOI file
 *
 * @param {Uint8Array|Uint8ClampedArray} imageBuffer Array containing colors of each pixel in image
 * @param {object} header QOI header
 * @param {int} header.width Image width in pixels (32-bit Big Endian)
 * @param {int} header.height Image height in pixels (32-bit Big Endian)
 * @param {int} header.channels Number of channels the image has (3 = RGB, 4 = RGBA)
 * @param {int} header.colorspace Colorspace used in image (0: sRGB with linear alpha, 1: linear)
 *
 * @returns {ArrayBuffer} ArrayBuffer containing QOI file contents
 */
const encode = (imageBuffer, header) => {
  const imageWidth = header.width;
  const imageHeight = header.height;
  const channels = header.channels || QOI_CHANNEL_RGBA;
  const colorspace = header.colorspace || QOI_SRGB; // sRGB by default, more web friendly

  const totalPixels = imageWidth * imageHeight * channels;;
  const finalPixel = totalPixels - channels;

  // Guard clauses
  if(imageWidth < 0 || imageWidth >= MAX_INT32)
    throw new Error(`Invalid header.width, must be within range of a positive 32-bit integer.`);
  if(imageHeight < 0 || imageHeight >= MAX_INT32)
    throw new Error(`Invalid header.height, must be within range of a positive 32-bit integer.`);
  if(channels !== QOI_CHANNEL_RGB && channels !== QOI_CHANNEL_RGBA)
    throw new Error(`Invalid header.channels, must be ${QOI_CHANNEL_RGB} or ${QOI_CHANNEL_RGBA}.`);
  if(colorspace !== QOI_SRGB && colorspace !== QOI_LINEAR)
    throw new Error(`Invalid header.colorspace, must be ${QOI_SRGB} or ${QOI_LINEAR}.`);
  if(imageBuffer.constructor.name !== 'Uint8Array' && imageBuffer.constructor.name !== 'Uint8ClampedArray')
    throw new Error(`The provided imageBuffer must be of type Uint8Array or Uint8ClampedArray!`);
  if(imageBuffer.length !== totalPixels)
    throw new Error(
      `The provided imageBuffer of length ${imageBuffer.length} does not match ${totalPixels} (${imageWidth}*${imageHeight}*${channels}). ` +
      'Make sure you are supplying an image binary and the correct headers.'
    );

  const maxSize = imageWidth * imageHeight * (channels + 1) + QOI_HEADER_SIZE + QOI_END_MARKER_SIZE;
  const bytes = new Uint8Array(maxSize);
  const seenPixels = Array.from(new Array(64), () => ({ r: 0, g: 0, b: 0, a: 0 }));

  let prevPixel = { r: 0, g: 0, b: 0, a: 255 };
  let p = 0;
  let run = 0;

  const write32 = (val) => {
    bytes[p++] = (val & 0xff000000) >> 24;
    bytes[p++] = (val & 0x00ff0000) >> 16;
    bytes[p++] = (val & 0x0000ff00) >> 8;
    bytes[p++] = (val & 0x000000ff);
  };

  // Write header, 14 bytes
  write32(QOI_MAGIC_BYTES); // 0 -> 3
  write32(imageWidth); // 4 -> 7
  write32(imageHeight); // 8 -> 11
  bytes[p++] = channels; // 12
  bytes[p++] = colorspace; // 13

  // Write data chunks
  for(let offset = 0; offset <= finalPixel; offset += channels) {
    const pixel = {
      r: imageBuffer[offset],
      g: imageBuffer[offset + 1],
      b: imageBuffer[offset + 2],
      a: channels === 4 ? imageBuffer[offset + 3] : prevPixel.a,
    };

    if(pixelsMatch(pixel, prevPixel)) {
      run++;

      if(run === 62 || offset === finalPixel) {
        bytes[p++] = QOI_OP_RUN | (run - 1);
        run = 0;
      }
    }
    else {
      if(run > 0) {
        bytes[p++] = QOI_OP_RUN | (run - 1);
        run = 0;
      }

      const h = hash({ r: pixel.r, g: pixel.g, b: pixel.b, a: pixel.a });
      if(pixelsMatch(pixel, seenPixels[h])) {
        bytes[p++] = QOI_OP_INDEX | h;
      }
      else {
        seenPixels[h] = {...pixel};

        const diff = pixelDiff(pixel, prevPixel);
        const dr_dg = diff.r - diff.g;
        const db_dg = diff.b - diff.g;

        // Only RGB values provided
        if(diff.a === 0) {
          if(
            (diff.r >= DIFF_CH_DIFF_LOWER_BOUND_RED && diff.r <= DIFF_CH_DIFF_UPPER_BOUND_RED) &&
            (diff.g >= DIFF_CH_DIFF_LOWER_BOUND_GREEN && diff.g <= DIFF_CH_DIFF_UPPER_BOUND_GREEN) &&
            (diff.b >= DIFF_CH_DIFF_LOWER_BOUND_BLUE && diff.b <= DIFF_CH_DIFF_UPPER_BOUND_BLUE)
          ) {
            bytes[p++] = (
              QOI_OP_DIFF |
              ((diff.r + DIFF_CH_DIFF_BIAS) << 4) |
              ((diff.g + DIFF_CH_DIFF_BIAS) << 2) |
              (diff.b + DIFF_CH_DIFF_BIAS)
            );
          }
          else if(
            (diff.g >= LUMA_CH_DIFF_LOWER_BOUND_GREEN && diff.g <= LUMA_CH_DIFF_UPPER_BOUND_GREEN) &&
            (dr_dg >= LUMA_CH_DIFF_LOWER_BOUND && dr_dg <= LUMA_CH_DIFF_UPPER_BOUND) &&
            (db_dg >= LUMA_CH_DIFF_LOWER_BOUND && db_dg <= LUMA_CH_DIFF_UPPER_BOUND)
          ) {
            bytes[p++] = QOI_OP_LUMA | (diff.g + LUMA_CH_DIFF_BIAS_GREEN);
            bytes[p++] = ((dr_dg + LUMA_CH_DIFF_BIAS) << 4) | (db_dg + LUMA_CH_DIFF_BIAS);
          }
          else {
            bytes[p++] = QOI_OP_RGB;
            bytes[p++] = pixel.r;
            bytes[p++] = pixel.g;
            bytes[p++] = pixel.b;
          }
        }
        else {
          bytes[p++] = QOI_OP_RGBA;
          bytes[p++] = pixel.r;
          bytes[p++] = pixel.g;
          bytes[p++] = pixel.b;
          bytes[p++] = pixel.a;
        }
      }
    }
    prevPixel = {...pixel};
  }

  // End marker
  QOI_END_MARKER.forEach(el => {
    bytes[p++] = el;
  });

  return bytes.slice(0, p);
};

module.exports = { encode };