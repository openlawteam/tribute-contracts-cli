#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { error } from "./src/utils/logging.js";
import { managingCommands } from "./src/interfaces/cli/commands/managing-cmd.js";
import { offchainCommands } from "./src/interfaces/cli/commands/offchain-cmd.js";
import { configurationCommands } from "./src/interfaces/cli/commands/configuration-cmd.js";
import { daoRegistryCommands } from "./src/interfaces/cli/commands/dao-registry-cmd.js";
import { daoArtifactsCommands } from "./src/interfaces/cli/commands/dao-artifacts-cmd.js";
import { bankExtensionCommands } from "./src/interfaces/cli/commands/bank-extension-cmd.js";
import { readFile } from "fs/promises";
import { Command } from "commander";
const program = new Command();
program.version("0.0.1");

const main = async () => {
  const buffer = await readFile("./package.json");
  const pkg = buffer.toJSON();
  program.version(pkg["version"]);

  managingCommands(program);
  offchainCommands(program);
  configurationCommands(program);
  daoRegistryCommands(program);
  daoArtifactsCommands(program);
  bankExtensionCommands(program);

  program
    .parseAsync(process.argv)
    .then(() => process.exit(0))
    .catch((e) => {
      error("Error:", e);
      process.exit(1);
    });
};

main();
