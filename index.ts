#!/usr/bin/env node

import { configs } from "./cli.config";
import { error, notice } from "./src/utils/logging";
import { managingCommands } from "./src/interfaces/cli/commands/managing-cmd.js";
import { offchainCommands } from "./src/interfaces/cli/commands/offchain-cmd.js";
import { Command } from "commander";
const program = new Command();
import { readFile } from "fs/promises";

const main = async () => {
  // const pkg = JSON.parse(await readFile("./package.json"));
  // program.version(pkg.version);

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

  program
    .parseAsync(process.argv)
    .then(() => process.exit(0))
    .catch((e) => {
      error("Error:", e);
      process.exit(1);
    });
};

main();
