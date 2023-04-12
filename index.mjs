#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
fs.readFile(path.resolve(__dirname, "package.json"), "UTF-8", callback);

function callback(err, _data) {
  if (err) {
    console.error("There is no package.json at " + __dirname);
  }

  let data;

  try {
    data = JSON.parse(_data);
  } catch (e) {
    console.error(`The package.json at ${__dirname} has invalid json`);
  }

  const scripts = data.scripts;
  if (!scripts) {
    throw new Error(`package.json at path ${__dirname} has no scripts`);
  }

  const keys = Object.keys(scripts);

  inquirer
    .prompt([
      {
        type: "list",
        name: "script",
        message: "Choose a script to run",
        choices: keys,
      },
    ])
    .then((answers) => {
      exec(scripts[answers.script], function (err, stdout, stderr) {
        console.log(stdout);
      });
    });
}
