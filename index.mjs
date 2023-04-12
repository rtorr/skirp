#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";

const __dirname = process.cwd();

console.log(__dirname);
fs.readFile(path.resolve(process.cwd(), "package.json"), "UTF-8", callback);

function callback(err, _data) {
  if (err) {
    return console.error("There is no package.json at " + __dirname);
  }

  let data;

  try {
    data = JSON.parse(_data);
  } catch (e) {
    console.error(`The package.json at ${__dirname} has invalid json`);
  }

  const scripts = data.scripts;
  if (!scripts) {
    return new Error(`package.json at path ${__dirname} has no scripts`);
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
