#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exit } = require('process');
const { encode } = require('./encoder');
const { PNG } = require('./util/png');
const { toGreen, toRed } = require('./util/colors');
const sharp = require('sharp');

const args = process.argv.slice(2);
const instructions = `qoi.js CLI for PNG <--> QOI conversion

Usage:

qoi encode <infile> <outfile>
qoi decode <infile> <outfile>

Examples:
  qoi encode input.png output.qoi
  qoi decode input.qoi output.png
`;

function run() {
  if(args.length < 3) {
    console.log(instructions);
    exit(1);
  }
  else {
    const command = args[0];

    if(command === 'encode')
      tryEncode();
    else if(command === 'decode') {
      const fileToDecode = args[1];
      console.log(`Decoding ${fileToDecode}...`);
    }
    else {
      console.log(instructions);
      exit(1);
    }
  }
}

async function tryEncode() {
  const fileToEncode = args[1];
  logMessage(`Encoding ${fileToEncode}...`);

  try {
    const file = fs.readFileSync(path.resolve(fileToEncode));
    console.log(file)

    const { data, info } = await sharp(file)
      .raw()
      .toBuffer({ resolveWithObject: true });
    console.log(data);
    console.log(info);

    const qoif = encode(new Uint8Array(data), {
      width: info.width,
      height: info.height,
      channels: info.channels,
    });
    console.log(qoif);

    const fileName = fileToEncode.substring(fileToEncode.lastIndexOf('/') + 1, fileToEncode.lastIndexOf('.'));
    fs.mkdir(`${__dirname}/../out`, { recursive: true }, (err) => {
      if(err) throw err;
    })

    fs.writeFile(`${__dirname}/../out/${fileName}.qoi`, qoif, (err) => {
      if(err) throw err;
      logMessage(`Encoded ${fileToEncode} (${file.buffer.length} bytes) to ${fileName}.qoi (${qoif.length} bytes)`);
      exit(0);
    });
  }
  catch(err) {
    logError(err, 'encode');
    exit(1);
  }
}

function logError(err, mode) {
  const m =
    mode === 'encode' ? ' - Encoding' :
    mode === 'decode' ? ' - Decoding' : '';
  console.log('[%s] %s', toGreen('qoi.js' + m), toRed(err.message));
  console.log(err);
}

function logMessage(msg) {
  console.log('[%s] %s', toGreen('qoi.js'), msg);
}

run();