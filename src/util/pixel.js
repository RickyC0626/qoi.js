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
const hash = (pixel) => (
  (pixel.r * 3 + pixel.g * 5 + pixel.b * 7 + pixel.a * 11) % 64
);

module.exports = { pixelsMatch, pixelDiff, hash };