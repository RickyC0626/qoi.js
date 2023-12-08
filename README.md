<h1 align="center">
  <img src="./assets/qoi-logo-gray-framed.svg" />
</h1>

<h1 align="center">
  🖼️ qoi.js
</h1>

<p align="center">
  <a href="https://github.com/phoboslab/qoi">
    <span>QOI codec</span>
  </a>
  <span>written in JavaScript.</span>
</p>

<h4 align="center">
  <img alt="GitHub Workflow Status (with event)" src="https://img.shields.io/github/actions/workflow/status/rickyc0626/qoi.js/ci.yml?style=flat-square">
  <img alt="npm" src="https://img.shields.io/npm/dt/%40rickyc0626%2Fqoi.js?style=flat-square">
  <img alt="GitHub License" src="https://img.shields.io/github/license/rickyc0626/qoi.js?style=flat-square">
  <br>
  <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/rickyc0626/qoi.js?style=flat-square">
  <img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/rickyc0626/qoi.js?style=flat-square">
</h4>

<h4 align="center">
  <span>Built with</span>
  <br><br>
  <a href="https://shields.io/#gh-light-mode-only">
    <img alt="Node.js" src="https://img.shields.io/badge/-Node.js-f6f8fa?style=for-the-badge&logo=node.js#gh-light-mode-only">
  </a>
  <a href="https://shields.io/#gh-dark-mode-only">
    <img alt="Node.js" src="https://img.shields.io/badge/-Node.js-161b22?style=for-the-badge&logo=node.js#gh-dark-mode-only">
  </a>
  <a href="https://shields.io/#gh-light-mode-only">
    <img alt="Sharp" src="https://img.shields.io/badge/-Sharp-f6f8fa?style=for-the-badge&logo=sharp#gh-light-mode-only">
  </a>
  <a href="https://shields.io/#gh-dark-mode-only">
    <img alt="Sharp" src="https://img.shields.io/badge/-Sharp-161b22?style=for-the-badge&logo=sharp#gh-dark-mode-only">
  </a>
  <a href="https://shields.io/#gh-light-mode-only">
    <img alt="Jest" src="https://img.shields.io/badge/-Jest-f6f8fa?style=for-the-badge&logo=jest&logoColor=C21325#gh-light-mode-only">
  </a>
  <a href="https://shields.io/#gh-dark-mode-only">
    <img alt="Jest" src="https://img.shields.io/badge/-Jest-161b22?style=for-the-badge&logo=jest&logoColor=C21325#gh-dark-mode-only">
  </a>
</h4>

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