const {
  QOI_HEADER_SIZE,
  QOI_END_MARKER,
  QOI_END_MARKER_SIZE,
  QOI_MAX_PIXELS,
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
  DIFF_CH_DIFF_LOWER_BOUND_RED,
  DIFF_CH_DIFF_UPPER_BOUND_RED,
  DIFF_CH_DIFF_LOWER_BOUND_GREEN,
  DIFF_CH_DIFF_UPPER_BOUND_GREEN,
  DIFF_CH_DIFF_LOWER_BOUND_BLUE,
  DIFF_CH_DIFF_UPPER_BOUND_BLUE,
  DIFF_CH_DIFF_BIAS,
  LUMA_CH_DIFF_LOWER_BOUND_GREEN,
  LUMA_CH_DIFF_UPPER_BOUND_GREEN,
  LUMA_CH_DIFF_LOWER_BOUND,
  LUMA_CH_DIFF_UPPER_BOUND,
  LUMA_CH_DIFF_BIAS_GREEN,
  LUMA_CH_DIFF_BIAS,
  RUN_LENGTH_LOWER_BOUND,
  RUN_LENGTH_UPPER_BOUND,
  RUN_LENGTH_BIAS,
} = require('./constants');
const {
  INVALID_BUFFER_TYPE,
  INVALID_BUFFER_LENGTH,
  INVALID_IMAGE_DIMENSIONS,
  INVALID_CHANNELS,
  INVALID_COLORSPACE
} = require('./util/errors');
const { pixelsMatch, pixelDiff, hash } = require('./util/pixel');

/**
 * Encode a QOI file
 *
 * @param {Uint8Array|Uint8ClampedArray} buffer Array containing colors of each pixel in image
 * @param {object} header QOI header
 * @param {int} header.width Image width in pixels (32-bit Big Endian)
 * @param {int} header.height Image height in pixels (32-bit Big Endian)
 * @param {int} header.channels Number of channels the image has (3 = RGB, 4 = RGBA)
 * @param {int} header.colorspace Colorspace used in image (0: sRGB with linear alpha, 1: linear)
 *
 * @returns {ArrayBuffer} ArrayBuffer containing QOI file contents
 */
const encode = (buffer, header) => {
  const width = header.width;
  const height = header.height;
  const channels = header.channels || QOI_CHANNEL_RGBA;
  const colorspace = header.colorspace || QOI_SRGB; // sRGB by default, more web friendly

  const totalPixels = width * height * channels;;
  const finalPixel = totalPixels - channels;

  validateBuffer(buffer, { totalPixels });
  validateHeader(header);

  const maxSize = width * height * (channels + 1) + QOI_HEADER_SIZE + QOI_END_MARKER_SIZE;
  const bytes = new Uint8Array(maxSize);
  const seenPixels = Array.from(new Array(64), () => ({ r: 0, g: 0, b: 0, a: 0 }));

  let prevPixel = { r: 0, g: 0, b: 0, a: 255 };
  let p = 0;
  let run = 0;

  const write32 = (val) => {
    bytes[p++] = (val & 0xff000000) >> 24; // 1st byte
    bytes[p++] = (val & 0x00ff0000) >> 16; // 2nd byte
    bytes[p++] = (val & 0x0000ff00) >> 8; // 3rd byte
    bytes[p++] = (val & 0x000000ff); // 4th byte
  };

  // Write header, 14 bytes
  write32(QOI_MAGIC_BYTES); // 0 -> 3
  write32(width); // 4 -> 7
  write32(height); // 8 -> 11
  bytes[p++] = channels; // 12
  bytes[p++] = colorspace; // 13

  // Write data chunks
  for(let offset = 0; offset <= finalPixel; offset += channels) {
    const pixel = {
      r: buffer[offset],
      g: buffer[offset + 1],
      b: buffer[offset + 2],
      a: channels === QOI_CHANNEL_RGBA ? buffer[offset + 3] : prevPixel.a,
    };

    if(pixelsMatch(pixel, prevPixel)) {
      run++;

      if(run === RUN_LENGTH_UPPER_BOUND || offset === finalPixel) {
        bytes[p++] = QOI_OP_RUN | (run + RUN_LENGTH_BIAS);
        run = 0;
      }
    }
    else {
      if(run >= RUN_LENGTH_LOWER_BOUND) {
        bytes[p++] = QOI_OP_RUN | (run + RUN_LENGTH_BIAS);
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
          if(possibleDiffChunk(diff)) {
            bytes[p++] = (
              QOI_OP_DIFF |
              ((diff.r + DIFF_CH_DIFF_BIAS) << 4) |
              ((diff.g + DIFF_CH_DIFF_BIAS) << 2) |
              (diff.b + DIFF_CH_DIFF_BIAS)
            );
          }
          else if(possibleLumaChunk(diff, dr_dg, db_dg)) {
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

const validateBuffer = (buffer, data) => {
  const { totalPixels } = data;

  if(buffer.constructor.name !== 'Uint8Array' && buffer.constructor.name !== 'Uint8ClampedArray')
    throw INVALID_BUFFER_TYPE(['Uint8Array', 'Uint8ClampedArray']);
  if(buffer.length !== totalPixels)
    throw INVALID_BUFFER_LENGTH(buffer.length, totalPixels);
};

const validateHeader = (header) => {
  const { width, height, channels, colorspace } = header;

  if(width < 1 || height < 1 || width * height >= QOI_MAX_PIXELS)
    throw INVALID_IMAGE_DIMENSIONS(1, (QOI_MAX_PIXELS - 1).toLocaleString());
  if(channels !== QOI_CHANNEL_RGB && channels !== QOI_CHANNEL_RGBA)
    throw INVALID_CHANNELS([QOI_CHANNEL_RGB, QOI_CHANNEL_RGBA]);
  if(colorspace !== QOI_SRGB && colorspace !== QOI_LINEAR)
    throw INVALID_COLORSPACE([QOI_SRGB, QOI_LINEAR]);
};

const possibleDiffChunk = (diff) => (
  (diff.r >= DIFF_CH_DIFF_LOWER_BOUND_RED && diff.r <= DIFF_CH_DIFF_UPPER_BOUND_RED) &&
  (diff.g >= DIFF_CH_DIFF_LOWER_BOUND_GREEN && diff.g <= DIFF_CH_DIFF_UPPER_BOUND_GREEN) &&
  (diff.b >= DIFF_CH_DIFF_LOWER_BOUND_BLUE && diff.b <= DIFF_CH_DIFF_UPPER_BOUND_BLUE)
);

const possibleLumaChunk = (diff, dr_dg, db_dg) => (
  (diff.g >= LUMA_CH_DIFF_LOWER_BOUND_GREEN && diff.g <= LUMA_CH_DIFF_UPPER_BOUND_GREEN) &&
  (dr_dg >= LUMA_CH_DIFF_LOWER_BOUND && dr_dg <= LUMA_CH_DIFF_UPPER_BOUND) &&
  (db_dg >= LUMA_CH_DIFF_LOWER_BOUND && db_dg <= LUMA_CH_DIFF_UPPER_BOUND)
);

module.exports = {
  encode,
  possibleDiffChunk,
  possibleLumaChunk,
};