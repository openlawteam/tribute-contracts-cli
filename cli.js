#!/usr/bin/env node

require("dotenv").config({ path: ".env" });
const { configs } = require("./cli-config");

const { error, notice } = require("./src/utils/logging");
const {
  managingCommands,
} = require("./src/interfaces/cli/commands/managing-cmd");
const {
  offchainCommands,
} = require("./src/interfaces/cli/commands/offchain-cmd");

const { Command } = require("commander");
const program = new Command();
program.version("0.0.1");

const main = () => {
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
