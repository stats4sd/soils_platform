/**
 * Parses a 'multipart/form-data' upload request
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
const path = require('path');
const os = require('os');
const fs = require('fs');
const d3 = require('d3-dsv');

const express = require('express');
const bodyParser = require('body-parser');
const csv = require('csvtojson')
const request = require('request');
const mysql = require('mysql');
const math = require('mathjs');
const iconv = require('iconv-js');
const config = require('./config');
const chardet = require('chardet');

// Node.js doesn't have a built-in multipart/form-data parsing library.
// Instead, we can use the 'busboy' library from NPM to parse these requests.
const Busboy = require('busboy');
const handle = require('./handle.js');



exports.uploadFile = async (req, res) => {
  if (req.method === 'POST') {
    const busboy = new Busboy({headers: req.headers});
    const tmpdir = os.tmpdir();

    // This object will accumulate all the fields, keyed by their name
    const fields = {};

    // This object will accumulate all the uploaded files, keyed by their name.
    const uploads = {};

    // This code will process each non-file field in the form.
    busboy.on('field', (fieldname, val) => {
      // TODO(developer): Process submitted field values here
      console.log(`Processed field ${fieldname}: ${val}.`);
      fields[fieldname] = val;
    });

    let fileWrites = [];

    // This code will process each file uploaded.
    busboy.on('file', (fieldname, file, filename) => {
      // Note: os.tmpdir() points to an in-memory file system on GCF
      // Thus, any files in it must fit in the instance's memory.
      console.log(`Processed file ${filename}`);
      const filepath = path.join(tmpdir, filename);
      uploads[fieldname] = filepath;

      const writeStream = fs.createWriteStream(filepath);
      file.pipe(writeStream);

      // File was processed by Busboy; wait for it to be written to disk.
      const promise = new Promise((resolve, reject) => {
        file.on('end', () => {
          writeStream.end();
        });
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      fileWrites.push(promise);
    });

    // Triggered once all uploaded files are processed by Busboy.
    // We still need to wait for the disk writes (saves) to complete.
    busboy.on('finish', () => {
      Promise.all(fileWrites).then(async () => {
        for (const name in uploads) {
          const file = uploads[name];
          //fs.unlinkSync(file);
          console.log("file = ", file)

          handledFile = await handle.handle(file);
          console.log("handled File response - ", handledFile);
        }

        res.send();

      });
    });

  busboy.end(req.rawBody);

  } else {
    // Return a "method not allowed" error
    console.log("NOPE");
    res.status(405).end();
  }
};






