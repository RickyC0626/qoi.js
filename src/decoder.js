const {
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
  DIFF_CH_DIFF_BIAS,
  LUMA_CH_DIFF_BIAS_GREEN,
  LUMA_CH_DIFF_BIAS,
} = require('./constants');
const {
  INVALID_FILE_SIGNATURE,
  INVALID_IMAGE_DIMENSIONS,
  INVALID_CHANNELS,
  INVALID_COLORSPACE
} = require('./util/errors');
const { hash } = require('./util/pixel');

/**
 * Decode a QOI file
 *
 * @param {Uint8Array|Uint8ClampedArray} buffer Array containing colors of each pixel in image
 *
 * @returns {object} Object containing raw pixels and additional image data
 */
const decode = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let p = 0;

  const read32 = () => {
    const a = bytes[p++];
    const b = bytes[p++];
    const c = bytes[p++];
    const d = bytes[p++];
    return a << 24 | b << 16 | c << 8 | d;
  };

  // Read header, 14 bytes
  const magic = read32(); // 0 -> 3
  const width = read32(); // 4 -> 7
  const height = read32(); // 8 -> 11
  const channels = bytes[p++]; // 12
  const colorspace = bytes[p++]; // 13

  validateHeader({ magic, width, height, channels, colorspace });

  const totalPixels = width * height * channels;
  const pixels = new Uint8Array(totalPixels);
  const seenPixels = Array.from(new Array(64), () => ({ r: 0, g: 0, b: 0, a: 255 }));

  const totalBytes = bytes.length;
  const chunkLength = totalBytes - 8;

  let prevPixel = { r: 0, g: 0, b: 0, a: 255 };
  let pixelPos = 0;
  let seenIndex = 0;
  let run = 0;

  // Read data chunks
  for(; pixelPos < totalPixels && p < totalBytes - 4; pixelPos += channels) {
    if(run > 0) run--;
    else if(p < chunkLength) {
      const byte = bytes[p++];

      if(byte === QOI_OP_RGB) {
        prevPixel.r = bytes[p++];
        prevPixel.g = bytes[p++];
        prevPixel.b = bytes[p++];
      }
      else if(byte === QOI_OP_RGBA) {
        prevPixel.r = bytes[p++];
        prevPixel.g = bytes[p++];
        prevPixel.b = bytes[p++];
        prevPixel.a = bytes[p++];
      }
      else if((byte & QOI_OP_RUN) === QOI_OP_INDEX) {
        prevPixel.r = seenPixels[byte * 4];
        prevPixel.g = seenPixels[byte * 4 + 1];
        prevPixel.b = seenPixels[byte * 4 + 2];
        prevPixel.a = seenPixels[byte * 4 + 3];
      }
      else if((byte & QOI_OP_RUN) === QOI_OP_DIFF) {
        prevPixel.r += ((byte >> 4) & 0b00000011) - DIFF_CH_DIFF_BIAS;
        prevPixel.g += ((byte >> 2) & 0b00000011) - DIFF_CH_DIFF_BIAS;
        prevPixel.b += (byte & 0b00000011) - DIFF_CH_DIFF_BIAS;

        // Handle wraparound
        prevPixel.r = (prevPixel.r + 256) % 256;
        prevPixel.g = (prevPixel.g + 256) % 256;
        prevPixel.b = (prevPixel.b + 256) % 256;
      }
      else if((byte & QOI_OP_RUN) === QOI_OP_LUMA) {
        const byte2 = bytes[p++];
        const greenDiff = (byte & 0b00111111) - LUMA_CH_DIFF_BIAS_GREEN;
        const redDiff = greenDiff + ((byte2 >> 4) & 0b00001111) - LUMA_CH_DIFF_BIAS;
        const blueDiff = greenDiff + (byte2 & 0b00001111) - LUMA_CH_DIFF_BIAS;

        // Handle wraparound
        prevPixel.r = (prevPixel.r + redDiff + 256) % 256;
        prevPixel.g = (prevPixel.g + greenDiff + 256) % 256;
        prevPixel.b = (prevPixel.b + blueDiff + 256) % 256;
      }
      else if((byte & QOI_OP_RUN) === QOI_OP_RUN) {
        run = byte & 0b00111111;
      }

      seenIndex = hash(prevPixel) * 4;
      seenPixels[seenIndex] = prevPixel.r;
      seenPixels[seenIndex + 1] = prevPixel.g;
      seenPixels[seenIndex + 2] = prevPixel.b;
      seenPixels[seenIndex + 3] = prevPixel.a;
    }

    if(channels === QOI_CHANNEL_RGBA) {
      pixels[pixelPos] = prevPixel.r;
      pixels[pixelPos + 1] = prevPixel.g;
      pixels[pixelPos + 2] = prevPixel.b;
      pixels[pixelPos + 3] = prevPixel.a;
    }
    else {
      pixels[pixelPos] = prevPixel.r;
      pixels[pixelPos + 1] = prevPixel.g;
      pixels[pixelPos + 2] = prevPixel.b;
    }
  }

  if(pixelPos < totalPixels)
    throw new Error('Decoding failed to construct a complete image.');

  return {
    data: pixels,
    width: width,
    height: height,
    channels: channels,
    colorspace: colorspace,
  };
};

const validateHeader = (header) => {
  const { magic, width, height, channels, colorspace } = header;

  if(magic !== QOI_MAGIC_BYTES)
    throw INVALID_FILE_SIGNATURE;
  if(width < 1 || height < 1 || width * height >= QOI_MAX_PIXELS)
    throw INVALID_IMAGE_DIMENSIONS(1, (QOI_MAX_PIXELS - 1).toLocaleString());
  if(channels !== QOI_CHANNEL_RGB && channels !== QOI_CHANNEL_RGBA)
    throw INVALID_CHANNELS([QOI_CHANNEL_RGB, QOI_CHANNEL_RGBA]);
  if(colorspace !== QOI_SRGB && colorspace !== QOI_LINEAR)
    throw INVALID_COLORSPACE([QOI_SRGB, QOI_LINEAR]);
};

module.exports = { decode };