const {
  encode,
  possibleDiffChunk,
  possibleLumaChunk,
  createDiffChunk,
  createLumaChunk1,
  createLumaChunk2,
  createRunChunk
} = require('../src/encoder');

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

  describe('Data chunk', () => {
    describe('QOI_OP_DIFF', () => {
      it('should be used if pixel diff is within range', () => {
        const diff = { r: 0, g: 1, b: -1 };

        expect(possibleDiffChunk(diff)).toBeTruthy();
      });

      it('should not be used if pixel diff is out of range', () => {
        const diff = { r: 10, g: 11, b: -11 };

        expect(possibleDiffChunk(diff)).toBeFalsy();
      });

      it('should match binary value', () => {
        const diff = { r: 0, g: 1, b: 1 };

        expect(createDiffChunk(diff)).toEqual(0b01101111);
      });
    });

    describe('QOI_OP_LUMA', () => {
      it('should be used if pixel diff is within range', () => {
        const diff = { g: 30 };
        const dr_dg = -4;
        const db_dg = 6;

        expect(possibleLumaChunk(diff, dr_dg, db_dg)).toBeTruthy();
      });

      it('should not be used if pixel diff is out of range', () => {
        const diff = { g: 50 };
        const dr_dg = 10;
        const db_dg = -20;

        expect(possibleLumaChunk(diff, dr_dg, db_dg)).toBeFalsy();
      });

      it('first half should match binary value', () => {
        const diff = { g: 0 };

        expect(createLumaChunk1(diff)).toEqual(0b10100000);
      });

      it('second half should match binary value', () => {
        const dr_dg = -6;
        const db_dg = 4;

        expect(createLumaChunk2(dr_dg, db_dg)).toEqual(0b00101100);
      });
    });

    describe('QOI_OP_RUN', () => {
      it('should match binary value', () => {
        const run = 9;

        expect(createRunChunk(run)).toEqual(0b11001000);
      });
    });
  });
});