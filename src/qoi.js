#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exit } = require('process');
const { encode } = require('./encoder');
const { decode } = require('./decoder');
const { toGreen, toRed } = require('./util/colors');
const sharp = require('sharp');
const { QOI_SRGB } = require('./constants');

const args = process.argv.slice(2);
const instructions = `qoi.js CLI for PNG <--> QOI conversion

Usage:

qoi encode <infile> [outfile]
qoi decode <infile> [outfile]

Examples:
  qoi encode input.png output.qoi
  qoi decode input.qoi output.png
`;

function run() {
  if(args.length < 2) {
    console.log(instructions);
    exit(1);
  }
  else {
    const command = args[0];

    if(command === 'encode')
      tryEncode();
    else if(command === 'decode')
      tryDecode();
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
    const { data, info } = await sharp(file)
      .raw()
      .toColorspace('srgb')
      .toBuffer({ resolveWithObject: true });

    const qoif = encode(new Uint8Array(data), {
      width: info.width,
      height: info.height,
      channels: info.channels,
      colorspace: QOI_SRGB,
    });

    const fileName = fileToEncode.substring(fileToEncode.lastIndexOf('/') + 1, fileToEncode.lastIndexOf('.'));
    fs.mkdir(`${__dirname}/../out`, { recursive: true }, (err) => {
      if(err) throw err;
    });

    fs.writeFile(`${__dirname}/../out/${fileName}.qoi`, qoif, (err) => {
      if(err) throw err;
      logMessage(
        `Encoded ${fileToEncode} (${file.buffer.byteLength} bytes, ${info.size} raw bytes) to ${fileName}.qoi (${qoif.length} bytes)`
      );
      exit(0);
    });
  }
  catch(err) {
    logError(err, 'encode');
    exit(1);
  }
}

async function tryDecode() {
  const fileToDecode = args[1];
  logMessage(`Decoding ${fileToDecode}...`);

  try {
    const file = fs.readFileSync(path.resolve(fileToDecode));
    const raw = decode(new Uint8Array(file));

    fs.mkdir(`${__dirname}/../out`, { recursive: true }, (err) => {
      if(err) throw err;
    });

    const image = sharp(raw.data, {
      raw: {
        width: raw.width,
        height: raw.height,
        channels: raw.channels,
      }
    }).toColorspace('srgb').png();

    const fileName = fileToDecode.substring(fileToDecode.lastIndexOf('/') + 1, fileToDecode.lastIndexOf('.'));
    await image.toFile(`${__dirname}/../out/${fileName}.png`)
      .then(data => {
        logMessage(
          `Decoded ${fileToDecode} (${file.buffer.byteLength} bytes, ${raw.data.length} raw bytes) to ${fileName}.png (${data.size} bytes)`
        );
        exit(0);
      })
      .catch((err) => {
        if(err) throw err;
      });
  }
  catch(err) {
    logError(err, 'decode');
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