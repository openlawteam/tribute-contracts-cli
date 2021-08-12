#!/usr/bin/env node

require("dotenv").config({ path: ".env" });

const {
  submitManagingProposal,
  processManagingProposal,
} = require("./src/adapters/managing-adapter");

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
      "submit-managing-proposal <adapterId> <adapterAddress> <keys> <values> <aclFlags> [data]"
    )
    .description("Submit a new managing proposal.")
    .action((adapterName, adapterAddress, keys, values, aclFlags, data) =>
      submitManagingProposal(
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
    .command("process-managing-proposal <proposalId>")
    .description("Process an existing managing proposal.")
    .action((proposalId) =>
      processManagingProposal(proposalId, { ...program.opts(), ...configs })
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
