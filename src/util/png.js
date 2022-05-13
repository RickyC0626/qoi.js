const firstByte = 0x89;
const pngSignature = 'PNG\r\n\x1a\n';
const pngFirstChunkName = 'IHDR';

const PNG = {
  validate(buffer) {
    if(firstByte !== buffer[0])
      throw new Error('File header does not match PNG');
    if(pngSignature !== buffer.toString('ascii', 1, 8))
      throw new Error('File signature does not match PNG');
    if(pngFirstChunkName !== buffer.toString('ascii', 12, 16))
      throw new Error('Invalid PNG file, missing IHDR chunk');
  },
  getDimensions(buffer) {
    const widthHex = buffer.toString('hex', 16, 20);
    const heightHex = buffer.toString('hex', 20, 24);

    if(!widthHex || !heightHex)
      throw new Error('File is missing image dimensions');

    const width = parseInt(widthHex, 16);
    const height = parseInt(heightHex, 16);

    return { width, height };
  }
};

module.exports = { PNG };