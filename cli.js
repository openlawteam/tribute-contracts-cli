#!/usr/bin/env node

require("dotenv").config({ path: ".env" });
const { configs } = require("./cli-config");

const {
  submitManagingProposal,
  processManagingProposal,
} = require("./src/adapters/managing-adapter");

const {
  newOffchainVote,
  submitOffchainResult,
} = require("./src/adapters/offchain-voting-adapter");

const inquirer = require("inquirer");
const { Command } = require("commander");
const { notice } = require("./src/utils/logging");
const { daoAccessFlags } = require("./src/core/dao-registry");
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

  // START - MANAGING VOTES CMDs
  program
    .command(
      "submit-managing-proposal <adapterId> <adapterAddress> [keys] [values] [data]"
    )
    .description("Submit a new managing proposal.")
    .action(async (adapterName, adapterAddress, keys, values, data) => {
      await inquirer
        .prompt([
          {
            type: "checkbox",
            message: "Select the ACL Flags or hit ENTER to skip",
            name: "aclFlags",
            choices: daoAccessFlags.map((f) => Object.assign({ name: f })),
          },
        ])
        .then((anwsers) =>
          submitManagingProposal(
            adapterName,
            adapterAddress,
            anwsers.aclFlags,
            keys,
            values,
            data,
            program.opts()
          )
        );
    });

  program
    .command("process-managing-proposal <proposalId>")
    .description("Process an existing managing proposal.")
    .action((proposalId) =>
      processManagingProposal(proposalId, program.opts())
    );
  // END - MANAGING VOTES CMDs

  // START - OFFCHAIN VOTES CMDs
  program
    .command("new-offchain-vote <snapshotProposalId> [data]")
    .description(
      "Submit an offchain vote to Snapshot Hub using the snapshot proposal id."
    )
    .action(async (snapshotProposalId, data) => {
      await inquirer
        .prompt([
          {
            type: "list",
            name: "choice",
            message: `Vote on proposal ${snapshotProposalId}`,
            choices: ["Yes", "No"],
          },
        ])
        .then((vote) =>
          newOffchainVote(snapshotProposalId, vote.choice, data, program.opts())
        );
    });

  program
    .command("submit-offchain-result <snapshotProposalId>")
    .description(
      "Submit an offchain vote result to the DAO using the snapshot proposal id."
    )
    .action((snapshotProposalId) => submitOffchainResult(snapshotProposalId));
  // END - OFFCHAIN VOTES CMDs

  program
    .parseAsync(process.argv)
    .then(() => process.exit(0))
    .catch((e) => {
      console.log("Error:", e);
      process.exit(1);
    });
};

main();
