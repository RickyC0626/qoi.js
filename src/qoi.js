const fs = require('fs');
const path = require('path');
const { exit } = require('process');
const { encode } = require('./encoder');
const sizeOf = require('image-size');

const args = process.argv.slice(2);
const instructions = `qoi.js

Usage:

node qoi encode <binary file> <original file>
node qoi decode <file.qoi>
`;

try {
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
      const originalFile = args[2];

      if(!originalFile)
        throw new Error(`You must supply the original file.`);

      console.log(`Encoding ${fileToEncode}...`);

      let file, buffer;

      file = fs.readFileSync(path.resolve(fileToEncode));
      buffer = new Uint8Array(file);
      // console.log(file);

      const origFile = fs.readFileSync(path.resolve(originalFile));
      const dimensions = sizeOf(origFile);
      const qoif = encode(buffer, {
        width: dimensions.width,
        height: dimensions.height,
      });
      // console.log(qoif);

      const fileName = fileToEncode.substring(fileToEncode.lastIndexOf('/') + 1, fileToEncode.lastIndexOf('.'));
      fs.mkdir(`${__dirname}/../out`, { recursive: true }, (err) => {
        if(err) throw err;
      })

      fs.writeFile(`${__dirname}/../out/${fileName}.qoi`, qoif, (err) => {
        if(err) throw err;
        console.log(
          `[\x1b[32m%s\x1b[0m] %s`, 'qoi.js',
          `Encoded ${fileToEncode} (${buffer.length} bytes) to ${fileName}.qoi (${qoif.length} bytes)`
        );
        exit(0);
      });
    }
    else if(command === 'decode') {
      const fileToDecode = args[1];
      console.log(`Decoding ${fileToDecode}...`);
    }
  }
}
catch(err) {
  console.log(`[\x1b[32m%s\x1b[0m] \x1b[31m%s\x1b[0m`, 'qoi.js', err.message);
  console.log(err)
  exit(1);
}