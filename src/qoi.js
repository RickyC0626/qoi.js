const fs = require('fs');
const path = require('path');
const { exit } = require('process');
const { encode } = require('./encoder');

const args = process.argv.slice(2);
const instructions = `qoi.js

Usage:

node qoi encode <image file> <width> <height>
node qoi decode <file.qoi>
`;

if(args.length === 0) {
  console.log(instructions);
  exit(1);
}
else {
  const command = args[0];

  if(command !== 'encode' && command !== 'decode') {
    console.log(instructions);
    exit(1);
  }
  if(args.length < 2) {
    console.log(instructions);
    exit(1);
  }

  if(command === 'encode') {
    const fileToEncode = args[1];

    if(!fileToEncode)
      throw new Error(`Invalid path to binary file.`);

    console.log(`Encoding ${fileToEncode}...`);

    let file, buffer;

    try {
      file = fs.readFileSync(path.resolve(fileToEncode));
      buffer = new Uint8Array(file.buffer);
      console.log(file);
      console.log(buffer);
    }
    catch(err) {
      console.log(`[\x1b[32m%s\x1b[0m] \x1b[31m%s\x1b[0m`, 'qoi.js', err.message);
      exit(1);
    }

    const image = new Uint8Array(buffer.length);

    try {
      const qoif = encode(file);
      console.log(qoif);
    }
    catch(err) {
      console.log(`[\x1b[32m%s\x1b[0m] \x1b[31m%s\x1b[0m`, 'qoi.js', err.message);
      exit(1);
    }
  }
  else if(command === 'decode') {
    const fileToDecode = args[1];
    console.log(`Decoding ${fileToDecode}...`);
  }
}