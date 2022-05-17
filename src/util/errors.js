const INVALID_BUFFER_TYPE = (...validTypes) => (
  `The provided buffer must be one of these types: [${validTypes}]`
);

const INVALID_BUFFER_LENGTH = (actualLength, expectedLength) => (
  `The provided buffer with length ${actualLength} does not match ${expectedLength} total pixels. ` +
  'Make sure you are supplying an image binary and the correct headers.'
);

const INVALID_IMAGE_DIMENSIONS = (minLength, maxLength) => (
  `Invalid image dimensions, must be in the range of ${minLength}..${maxLength}`
);

const INVALID_CHANNELS = (...validChannels) => (
  `Invalid channels in header, must be one of the following: [${validChannels}]`
);

const INVALID_COLORSPACE = (...validColorspaces) => (
  `Invalid colorspace in header, must be one of the following: [${validColorspaces}]`
);

const INVALID_FILE_SIGNATURE = 'Cannot decode, file header does not contain QOI signature.';

module.exports = {
  INVALID_BUFFER_TYPE,
  INVALID_BUFFER_LENGTH,
  INVALID_IMAGE_DIMENSIONS,
  INVALID_CHANNELS,
  INVALID_COLORSPACE,
  INVALID_FILE_SIGNATURE,
};