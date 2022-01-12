#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { configs } from "./cli-config.js";
import { error, notice } from "./src/utils/logging.js";
import { managingCommands } from "./src/interfaces/cli/commands/managing-cmd.js";
import { offchainCommands } from "./src/interfaces/cli/commands/offchain-cmd.js";
import { daoRegistryCommands } from "./src/interfaces/cli/commands/dao-registry-cmd.js";
import { configurationCommands } from "./src/interfaces/cli/commands/configuration-cmd.js";
import { daoArtifactsCommands } from "./src/interfaces/cli/commands/dao-artifacts-cmd.js";
import { readFile } from "fs/promises";
import { Command } from "commander";
const program = new Command();
program.version("0.0.1");

const main = async () => {
  const buffer = await readFile("./package.json");
  const pkg = buffer.toJSON();
  program.version(pkg["version"]);

  program
    .command("list")
    .description("List all contracts available to interact with.")
    .action(() => {
      notice("Available contracts to interact...");
      Object.keys(configs.contracts).map((c) =>
        console.log(`${c} @ ${configs.contracts[c]}`)
      );
    });

  managingCommands(program);
  offchainCommands(program);
  daoRegistryCommands(program);
  configurationCommands(program);
  daoArtifactsCommands(program);

  program
    .parseAsync(process.argv)
    .then(() => process.exit(0))
    .catch((e) => {
      error("Error:", e);
      process.exit(1);
    });
};

main();
