const decode = (imageBuffer) => {
  // Header check
  const buf = imageBuffer;
  const magic = buf[0] + buf[1] + buf[2] + buf[3];

  console.log(magic);
};

module.exports = { decode };