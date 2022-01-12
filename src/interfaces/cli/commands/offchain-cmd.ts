import inquirer from "inquirer";
import { sha3 } from "tribute-contracts/utils/contract-util.js";
import { configs } from "../../../../cli-config.js";

import {
  submitOffchainResult,
  newOffchainVote,
} from "../../../contracts/adapters/offchain-voting-adapter.js";
import {
  logEnvConfigs,
  success,
  notice,
  info,
  error,
} from "../../../utils/logging.js";

export const offchainCommands = (program) => {
  program
    .command("vote <snapshotProposalId>")
    .description("Submits a vote to Snapshot Hub.")
    .action(async (snapshotProposalId) => {
      await inquirer
        .prompt([
          {
            type: "list",
            name: "choice",
            message: `Vote on proposal ${snapshotProposalId}`,
            choices: ["Yes", "No"],
          },
        ])
        .then((vote) => {
          const daoProposalId = sha3(snapshotProposalId);

          notice(`\n ::: Submitting offchain voting...\n`);
          logEnvConfigs(configs);
          info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
          info(`DAO Proposal Id:\t${daoProposalId}`);
          info(`Choice:\t\t\t${vote.choice}`);

          return newOffchainVote(
            snapshotProposalId,
            daoProposalId,
            vote.choice
          );
        })
        .then((res) => {
          notice(`Member ${res.memberAddress} has voted "${res.choice}"\n`);
          notice(`Snapshot Proposal Id ${snapshotProposalId}\n`);
          success("::: Offchain vote submitted to Snapshot Hub.");
        })
        .catch((err) => error("Error while voting on proposal", err));
    });

  program
    .command("vote-result <snapshotProposalId>")
    .description("Submits the results of the voting to the DAO.")
    .action((snapshotProposalId) => {
      const daoProposalId = sha3(snapshotProposalId);

      notice(`\n ::: Submitting offchain voting results...\n`);
      logEnvConfigs(configs);

      info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
      info(`DAO Proposal Id:\t${daoProposalId}`);

      return submitOffchainResult(snapshotProposalId, daoProposalId)
        .then((res) => {
          notice(`Snapshot Proposal Id ${res.snapshotProposalId}\n`);
          success(`::: Offchain vote results submitted to the DAO`);
        })
        .catch((err) => error("Error while submitting vote results", err));
    });

  return program;
};
