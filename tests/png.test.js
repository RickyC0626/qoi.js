const { PNG } = require('../src/util/png');

const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const ihdrLength = [0x00, 0x00, 0x00, 0x00];
const ihdrType = [0x49, 0x48, 0x44, 0x52];

const wrongFirstByte = [0x00, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const wrongSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x00];

const correctPNG = [...pngHeader, ...ihdrLength, ...ihdrType];
const noIHDR = [...pngHeader];
const noHeader = [...ihdrLength, ...ihdrType];

describe('PNG.validate', () => {
  it('should be defined', () => {
    expect(PNG.validate).toBeDefined();
  });

  it('should not throw if correct PNG format is supplied', () => {
    const buffer = Buffer.from(correctPNG);

    expect(() => PNG.validate(buffer)).not.toThrow();
  });

  it('should throw if missing IHDR chunk', () => {
    const buffer = Buffer.from(noIHDR);

    expect(() => PNG.validate(buffer)).toThrow();
  });

  it('should throw if missing header', () => {
    const buffer = Buffer.from(noHeader);

    expect(() => PNG.validate(buffer)).toThrow();
  });

  it('should throw if first byte in header is wrong', () => {
    const buffer = Buffer.from(wrongFirstByte);

    expect(() => PNG.validate(buffer)).toThrow();
  });

  it('should throw if header has wrong signature', () => {
    const buffer = Buffer.from(wrongSignature);

    expect(() => PNG.validate(buffer)).toThrow();
  });
});

const missingDimensions = correctPNG;
const fakeWidth = [0x00, 0x00, 0x00, 0x80]; // 128
const fakeWidthDec = 128;
const fakeHeight = [0x00, 0x00, 0x04, 0x00]; // 1024
const fakeHeightDec = 1024;
const withDimensions = [...correctPNG, ...fakeWidth, ...fakeHeight];

describe('PNG.getDimensions', () => {
  it('should be defined', () => {
    expect(PNG.getDimensions).toBeDefined();
  });

  it('should throw if missing image dimensions', () => {
    const buffer = Buffer.from(missingDimensions);

    expect(() => PNG.getDimensions(buffer)).toThrow();
  });

  it('should return object with numeric width and height', () => {
    const buffer = Buffer.from(withDimensions);
    const dimensions = PNG.getDimensions(buffer);

    expect(dimensions.width).toBeDefined();
    expect(dimensions.height).toBeDefined();
    expect(Number.isInteger(dimensions.width)).toBeTruthy();
    expect(Number.isInteger(dimensions.height)).toBeTruthy();
  });

  it('dimensions should match correct decimal values', () => {
    const buffer = Buffer.from(withDimensions);
    const dimensions = PNG.getDimensions(buffer);

    expect(dimensions.width).toBe(fakeWidthDec);
    expect(dimensions.height).toBe(fakeHeightDec);
  });
});