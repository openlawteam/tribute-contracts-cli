#!/usr/bin/env node

require("dotenv").config({ path: ".env" });

const { newManagingProposal } = require("./src/adapters/managing-adapter");
const { configs } = require("./cli-config");
const { Command } = require("commander");
const program = new Command();
program.version("0.0.1");

const supportedContracts = ["ManagingContract"];

const main = () => {
  program.option(
    "-C, --contract <contract>",
    "The 42 digits startign with 0x contract address which CLI should interact with."
  );

  program
    .command("list")
    .description("List all contracts to interact with.")
    .action(() => supportedContracts.map((c) => console.log(c)));

  program
    .command(
      "adapter-add <adapterId> <adapterAddress> <keys> <values> <aclFlags> [data]"
    )
    .description("Submit a new managing proposal.")
    .action(async (adapterName, adapterAddress, keys, values, aclFlags, data) =>
      newManagingProposal(
        adapterName,
        adapterAddress,
        keys,
        values,
        aclFlags,
        data,
        { ...program.opts(), ...configs }
      )
    );

  program
    .parseAsync(process.argv)
    .then(() => process.exit(0))
    .catch((e) => {
      console.log("Error:", e);
      process.exit(1);
    });
};

main();
