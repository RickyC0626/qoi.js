const {
  encode,
  possibleDiffChunk,
  possibleLumaChunk,
  createDiffChunk,
  createLumaChunk1,
  createLumaChunk2,
  createRunChunk,
  createIndexChunk
} = require('../src/encoder');

describe('Encoder', () => {
  describe('Buffer validator', () => {
    it('should throw error if buffer is not Uint8Array nor Uint8ClampedArray', () => {
      const buffer = [];
      const header = { width: 1, height: 1, channels: 4, colorspace: 0 };
      const expected =
        'The provided buffer must be one of these types: [Uint8Array,Uint8ClampedArray]';

      expect(() => encode(buffer, header)).toThrowError(expected);
    });

    it('should throw error if buffer length does not match total pixels', () => {
      const buffer = new Uint8Array(4);
      const header = { width: 1, height: 2, channels: 4, colorspace: 0 };
      const expected =
        'The provided buffer with length 4 does not match 8 total pixels. ' +
        'Make sure you are supplying an image binary and the correct headers.';

      expect(() => encode(buffer, header)).toThrowError(expected);
    });
  });

  describe('Header validator', () => {
    it('should throw error if image width is not a positive number', () => {
      const buffer = new Uint8Array(0);
      const header = { width: 0, height: 1, channels: 4, colorspace: 0 };
      const expected =
        'Invalid image dimensions, must be in the range of 1..399,999,999';

      expect(() => encode(buffer, header)).toThrowError(expected);
    });

    it('should throw error if image height is not a positive number', () => {
      const buffer = new Uint8Array(0);
      const header = { width: 1, height: 0, channels: 4, colorspace: 0 };
      const expected =
        'Invalid image dimensions, must be in the range of 1..399,999,999';

      expect(() => encode(buffer, header)).toThrowError(expected);
    });

    it('should throw error if total pixels >= 400 million', () => {
      const buffer = new Uint8Array(1200000000);
      const header1 = { width: 400000000, height: 1, channels: 3, colorspace: 0 };
      const header2 = { width: 1, height: 400000000, channels: 3, colorspace: 0 };
      const expected =
        'Invalid image dimensions, must be in the range of 1..399,999,999';

      expect(() => encode(buffer, header1)).toThrowError(expected);
      expect(() => encode(buffer, header2)).toThrowError(expected);
    });

    it('should throw error if "channels" is not 3 (RGB) or 4 (RGBA)', () => {
      const buffer = new Uint8Array(2);
      const header = { width: 1, height: 1, channels: 2, colorspace: 0 };
      const expected =
        'Invalid channels in header, must be one of the following: [3,4]';

      expect(() => encode(buffer, header)).toThrowError(expected);
    });

    it('should throw error if colorspace is neither 0 (sRGB) nor 1 (linear)', () => {
      const buffer = new Uint8Array(4);
      const header = { width: 1, height: 1, channels: 4, colorspace: -1 };
      const expected =
        'Invalid colorspace in header, must be one of the following: [0,1]';

      expect(() => encode(buffer, header)).toThrowError(expected);
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
        // QOI_OP_DIFF = 01
        // r = 0 + 2 = 10
        // g = 1 + 2 = 11
        // b = 1 + 2 = 11
        // chunk = 01 10 11 11
        const expected = 0b01101111;

        expect(createDiffChunk(diff)).toEqual(expected);
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
        // QOI_OP_LUMA = 10
        // diff.g = 0 + 32 = 100000
        // first chunk = 10 100000
        const expected = 0b10100000;

        expect(createLumaChunk1(diff)).toEqual(expected);
      });

      it('second half should match binary value', () => {
        const dr_dg = -6;
        const db_dg = 4;
        // dr_dg = -6 + 8 = 2 = 0010
        // db_dg = 4 + 8 = 12 = 1100
        // second chunk = 0010 1100
        const expected = 0b00101100;

        expect(createLumaChunk2(dr_dg, db_dg)).toEqual(expected);
      });
    });

    describe('QOI_OP_RUN', () => {
      it('should match binary value', () => {
        const run = 9;
        // QOI_OP_RUN = 11
        // run = 9 - 1 = 8 = 001000
        // chunk = 11 001000
        const expected = 0b11001000;

        expect(createRunChunk(run)).toEqual(expected);
      });
    });

    describe('QOI_OP_INDEX', () => {
      it('should match binary value', () => {
        const hash = 24;
        // QOI_OP_INDEX = 00
        // hash = 24 = 011000
        // chunk = 00 011000
        const expected = 0b00011000;

        expect(createIndexChunk(hash)).toEqual(expected);
      })
    });
  });
});
