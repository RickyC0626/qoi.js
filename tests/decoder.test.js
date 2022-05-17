const { decode } = require('../src/decoder');

const magic = [0x71, 0x6f, 0x69, 0x66];
const validWidth = [0x00, 0x00, 0x00, 0x40];
const validHeight = [0x00, 0x00, 0x00, 0x40];
const validChannels = 0x04;

describe('Decoder', () => {
  describe('Header validator', () => {
    it('should throw error if QOI magic bytes are missing', () => {
      const buffer = new Uint8Array(0);
      const expected =
        'Cannot decode, file header does not contain QOI signature.'

      expect(() => decode(buffer)).toThrowError(expected);
    });

    it('should throw error if image width is not a positive number', () => {
      const width = [0x00, 0x00, 0x00, 0x00];
      const buffer = [...magic, ...width];
      const expected =
        'Invalid image dimensions, must be in the range of 1..399,999,999';

      expect(() => decode(buffer)).toThrowError(expected);
    });

    it('should throw error if image height is not a positive number', () => {
      const width = [0x00, 0x00, 0x00, 0x00];
      const height = [0x00, 0x00, 0x00, 0x00];
      const buffer = [...magic, ...width, ...height];
      const expected =
        'Invalid image dimensions, must be in the range of 1..399,999,999';

      expect(() => decode(buffer)).toThrowError(expected);
    });

    it('should throw error if total pixels >= 400 million', () => {
      const width = [0x00, 0xff, 0xff, 0xff];
      const height = [0x00, 0x00, 0xff, 0xff];
      const buffer = [...magic, ...width, ...height];
      const expected =
        'Invalid image dimensions, must be in the range of 1..399,999,999';

      expect(() => decode(buffer)).toThrowError(expected);
    });

    it('should throw error if "channels" is not 3 (RGB) or 4 (RGBA)', () => {
      const channels = 0x05;
      const buffer = [...magic, ...validWidth, ...validHeight, channels];
      const expected =
        'Invalid channels in header, must be one of the following: [3,4]';

      expect(() => decode(buffer)).toThrowError(expected);
    });

    it('should throw error if colorspace is neither 0 (sRGB) nor 1 (linear)', () => {
      const colorspace = 0x02;
      const buffer = [
        ...magic, ...validWidth, ...validHeight, validChannels, colorspace
      ];
      const expected =
        'Invalid colorspace in header, must be one of the following: [0,1]';

      expect(() => decode(buffer)).toThrowError(expected);
    });
  });
});