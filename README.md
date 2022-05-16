<img src="./assets/qoi-logo-gray-framed.svg" />

# qoi.js
[QOI codec](https://github.com/phoboslab/qoi) written in JavaScript.

## Installation

Install package
```sh
yarn add @rickyc0626/qoi.js
```

### Using the QOI API

```js
const { QOI } = require('@rickyc0626/qoi.js');

const header = { width, height, channels, colorspace };
const encoded = QOI.encode(new Uint8Array(rawPixels), header);
const decoded = QOI.decode(buffer);
```

### Using the PNG <--> QOI Converter

```
qoi.js CLI for PNG <--> QOI conversion

Usage:

qoi encode <infile> [outfile]
qoi decode <infile> [outfile]

Examples:
  qoi encode input.png output.qoi
  qoi decode input.qoi output.png
```

Run the following, `outfile` is optional. By default any encoded / decoded files will be generated in `/out`.
```sh
node src/qoi encode file.png
node src/qoi decode file.qoi
```