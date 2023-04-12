#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseArgsStringToArgv } from "string-argv";

const __dirname = process.cwd();

fs.readFile(path.resolve(process.cwd(), "package.json"), "UTF-8", callback);

async function run(command) {
  return new Promise((resolve) => {
    let args = parseArgsStringToArgv(command);
    let cmd = args.shift();

    let step = spawn(cmd, args);

    step.stdout.pipe(process.stdout);
    step.stderr.pipe(process.stderr);

    step.on("close", (code) => {
      resolve(code);
    });
  });
}

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
      run(scripts[answers.script]);
    });
}
