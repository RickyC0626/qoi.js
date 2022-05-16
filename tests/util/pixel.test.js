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
});

describe('pixelDiff', () => {
  it('should return the difference between pixels', () => {
    const p1 = { r: 10, g: 10, b: 10, a: 0 };
    const p2 = { r: 10, g: 5, b: 4, a: 0 };
    const expected = { r: 0, g: 5, b: 6, a: 0 };

    expect(pixelDiff(p1, p2)).toEqual(expected);
  });
});