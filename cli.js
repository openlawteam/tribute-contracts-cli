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

const {
  daoRegistryCommands,
} = require("./src/interfaces/cli/commands/dao-registry-cmd");

const { readFile } = require("fs/promises");
const { Command } = require("commander");
const program = new Command();
program.version("0.0.1");

const main = async () => {
  const pkg = JSON.parse(await readFile("./package.json"));
  program.version(pkg.version);

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

  program
    .parseAsync(process.argv)
    .then(() => process.exit(0))
    .catch((e) => {
      error("Error:", e);
      process.exit(1);
    });
};

main();
