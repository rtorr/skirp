#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import inquirer from "inquirer";
import { parseArgsStringToArgv } from "string-argv";
import ora from "ora";
import hasYarn from "has-yarn";
import mapWorkspaces from "@npmcli/map-workspaces";
import searchList from "inquirer-search-list";

inquirer.registerPrompt("search-list", searchList);
const fsPromises = fs.promises;
const workingDirectory = process.cwd();

async function getPackageJson(cwd) {
  let packageJson;
  try {
    packageJson = await fsPromises.readFile(
      path.resolve(cwd, "package.json"),
      "UTF-8"
    );
  } catch (e) {
    console.error("There is no package.json at " + workingDirectory);
  }
  let data;
  try {
    data = JSON.parse(packageJson);
  } catch (e) {
    console.error(`The package.json at ${workingDirectory} has invalid json`);
  }
  return data;
}

function getScripts(pkg, key, value) {
  const children = pkg.scripts
    ? Object.keys(pkg.scripts).map((script) => {
        return {
          name: `${key} : ${script}`,
          value: {
            key,
            cwd: value,
            script,
          },
        };
      })
    : [];
  return children;
}

async function getEeverything() {
  const pkg = await getPackageJson(process.cwd());
  let workspacePaths = await mapWorkspaces({
    cwd: process.cwd(),
    pkg,
  });
  let rootName = pkg.name ? pkg.name : "root";
  let workspacesScripts = [];
  workspacePaths.forEach((value, key) => {
    workspacesScripts.push(
      (async function childScript() {
        const pkg = await getPackageJson(value);
        return getScripts(pkg, key, value);
      })()
    );
  });
  workspacesScripts = await Promise.all(workspacesScripts);
  const rv = getScripts(pkg, rootName, process.cwd());
  return [...rv, ...workspacesScripts].flat();
}

(async function run() {
  const choices = await getEeverything();
  const answers = await inquirer.prompt([
    {
      type: "search-list",
      name: "script",
      message: "Choose a script to run",
      choices: choices,
    },
  ]);
  console.log(answers);
  const spinner = ora().start();
  const runner = hasYarn(workingDirectory) ? "yarn" : "npm";
  let args = parseArgsStringToArgv(`${runner} run ${answers.script.script}`);
  let cmd = args.shift();
  let step = spawn(cmd, args, { cwd: answers.script.cwd });
  step.stdout.pipe(process.stdout);
  step.stderr.pipe(process.stderr);
  step.on("close", () => {
    spinner.stop();
  });
})();
