#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseArgsStringToArgv } from "string-argv";
import ora from "ora";

const workingDirectory = process.cwd();

fs.readFile(path.resolve(process.cwd(), "package.json"), "UTF-8", callback);

function callback(err, _data) {
  if (err) {
    return console.error("There is no package.json at " + workingDirectory);
  }

  let data;

  try {
    data = JSON.parse(_data);
  } catch (e) {
    console.error(`The package.json at ${workingDirectory} has invalid json`);
  }

  const scripts = data.scripts;
  if (!scripts) {
    return new Error(`package.json at path ${workingDirectory} has no scripts`);
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
      ora().start();

      let args = parseArgsStringToArgv(`npm run ${answers.script}`);
      let cmd = args.shift();

      let step = spawn(cmd, args, { cwd: workingDirectory });

      step.stdout.pipe(process.stdout);
      step.stderr.pipe(process.stderr);
    });
}
