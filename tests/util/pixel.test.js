const { pixelsMatch, pixelDiff, hash } = require('../../src/util/pixel');

describe('pixelsMatch', () => {
  it('should return true if pixels match', () => {
    const p1 = { r: 0, g: 0, b: 0, a: 0 };
    const p2 = { r: 0, g: 0, b: 0, a: 0 };

    expect(pixelsMatch(p1, p2)).toBeTruthy();
  });

  it('should return false if pixels differ', () => {
    const p1 = { r: 0, g: 0, b: 0, a: 0 };
    const p2 = { r: 10, g: 0, b: 0, a: 0 };

    expect(pixelsMatch(p1, p2)).toBeFalsy();
  });

  it('should return false if either pixel is undefined', () => {
    const p = { r: 0, g: 0, b: 0, a: 0 };

    expect(pixelsMatch(p, undefined)).toBeFalsy();
    expect(pixelsMatch(undefined, p)).toBeFalsy();
  });
});

describe('pixelDiff', () => {
  it('should return the difference between pixels', () => {
    const p1 = { r: 10, g: 10, b: 10, a: 0 };
    const p2 = { r: 10, g: 5, b: 4, a: 0 };
    const expected = { r: 0, g: 5, b: 6, a: 0 };

    expect(pixelDiff(p1, p2)).toEqual(expected);
  });
});

describe('hash', () => {
  it('should return the correct hash', () => {
    const pixel = { r: 10, g: 5, b: 2, a: 0 };
    const expected = 5;

    expect(hash(pixel)).toEqual(expected);
  });
});