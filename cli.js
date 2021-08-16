#!/usr/bin/env node

require("dotenv").config({ path: ".env" });
const { configs } = require("./cli-config");

const {
  submitManagingProposal,
  processManagingProposal,
} = require("./src/adapters/managing-adapter");

const {
  voteOnProposal,
  submitVoteResult,
} = require("./src/adapters/offchain-voting-adapter");

const inquirer = require("inquirer");
const { Command } = require("commander");
const { notice } = require("./src/utils/logging");
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

  program
    .command(
      "submit-managing-proposal <adapterId> <adapterAddress> <aclFlags> [keys] [values] [data]"
    )
    .description("Submit a new managing proposal.")
    .action((adapterName, adapterAddress, aclFlags, keys, values, data) =>
      submitManagingProposal(
        adapterName,
        adapterAddress,
        aclFlags,
        keys,
        values,
        data,
        program.opts()
      )
    )
    .command("process-managing-proposal <proposalId>")
    .description("Process an existing managing proposal.")
    .action((proposalId) =>
      processManagingProposal(proposalId, { ...program.opts(), ...configs })
    );

  program
    .command("vote <snapshotProposalId> [data]")
    .description(
      "Submit an offchain vote to Snapshot Hub using the snapshot proposal id."
    )
    .action(async (snapshotProposalId, data) => {
      const vote = await inquirer.prompt([
        {
          type: "list",
          name: "choice",
          message: `Vote on proposal ${snapshotProposalId}`,
          choices: ["Yes", "No"],
        },
      ]);

      await voteOnProposal(snapshotProposalId, vote.choice, data, {
        ...program.opts(),
        ...configs,
      });
    });

  program
    .parseAsync(process.argv)
    .then(() => process.exit(0))
    .catch((e) => {
      console.log("Error:", e);
      process.exit(1);
    });
};

main();
