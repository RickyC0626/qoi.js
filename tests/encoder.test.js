const { encode } = require('../src/encoder');

describe('Encoder', () => {
  describe('Buffer validator', () => {
    it('should throw error if buffer is not Uint8Array nor Uint8ClampedArray', () => {
      const buffer = [];
      const header = { width: 1, height: 1, channels: 4, colorspace: 0 };

      expect(() => encode(buffer, header)).toThrowError(
        'The provided buffer must be one of these types: [Uint8Array,Uint8ClampedArray]'
      );
    });

    it('should throw error if buffer length does not match total pixels', () => {
      const buffer = new Uint8Array(4);
      const header = { width: 1, height: 2, channels: 4, colorspace: 0 };

      expect(() => encode(buffer, header)).toThrowError(
        'The provided buffer with length 4 does not match 8 total pixels. ' +
        'Make sure you are supplying an image binary and the correct headers.'
      );
    });
  });

  describe('Header validator', () => {
    it('should throw error if image width is not a positive number', () => {
      const buffer = new Uint8Array(0);
      const header = { width: 0, height: 1, channels: 4, colorspace: 0 };

      expect(() => encode(buffer, header)).toThrowError(
        'Invalid image dimensions, must be in the range of 1..399,999,999'
      );
    });

    it('should throw error if image height is not a positive number', () => {
      const buffer = new Uint8Array(0);
      const header = { width: 1, height: 0, channels: 4, colorspace: 0 };

      expect(() => encode(buffer, header)).toThrowError(
        'Invalid image dimensions, must be in the range of 1..399,999,999'
      );
    });

    it('should throw error if total pixels >= 400 million', () => {
      const buffer = new Uint8Array(1200000000);
      const header1 = { width: 400000000, height: 1, channels: 3, colorspace: 0 };
      const header2 = { width: 1, height: 400000000, channels: 3, colorspace: 0 };

      expect(() => encode(buffer, header1)).toThrowError(
        'Invalid image dimensions, must be in the range of 1..399,999,999'
      );
      expect(() => encode(buffer, header2)).toThrowError(
        'Invalid image dimensions, must be in the range of 1..399,999,999'
      );
    });

    it('should throw error if "channels" is not 3 (RGB) or 4 (RGBA)', () => {
      const buffer = new Uint8Array(2);
      const header = { width: 1, height: 1, channels: 2, colorspace: 0 };

      expect(() => encode(buffer, header)).toThrowError(
        'Invalid channels in header, must be one of the following: [3,4]'
      );
    });

    it('should throw error if colorspace is neither 0 (sRGB) nor 1 (linear)', () => {
      const buffer = new Uint8Array(4);
      const header = { width: 1, height: 1, channels: 4, colorspace: -1 };

      expect(() => encode(buffer, header)).toThrowError(
        'Invalid colorspace in header, must be one of the following: [0,1]'
      );
    });
  });
});