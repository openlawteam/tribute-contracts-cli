import inquirer from "inquirer";
import { sha3 } from "tribute-contracts/utils/ContractUtil.js";
import { configs } from "../../../../cli.config.js";
import {
  logEnvConfigs,
  success,
  notice,
  info,
  error,
} from "../../../utils/logging.js";

export const offchainCommands = (program) => {
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
        .then((vote) => {
          const daoProposalId = sha3(snapshotProposalId);

          notice(`\n ::: Submitting offchain voting...\n`);
          logEnvConfigs(configs, configs.contracts.OffchainVoting);
          info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
          info(`DAO Proposal Id:\t${daoProposalId}`);
          info(`Choice:\t\t\t${vote.choice}`);
          info(`Data:\t\t\t${data ? data : "n/a"}\n`);

          return newOffchainVote(
            snapshotProposalId,
            daoProposalId,
            vote.choice,
            data
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
    .command("submit-offchain-result <snapshotProposalId>")
    .description(
      "Submit an offchain vote result to the DAO using the snapshot proposal id."
    )
    .action((snapshotProposalId) => {
      const daoProposalId = sha3(snapshotProposalId);

      notice(`\n ::: Submitting offchain voting results...\n`);
      logEnvConfigs(configs, configs.contracts.OffchainVotingContract);

      info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
      info(`DAO Proposal Id:\t${daoProposalId}`);

      return submitOffchainResult(snapshotProposalId, daoProposalId)
        .then((res) => {
          notice(`DAO Proposal Id ${res.daoProposalId}\n`);
          notice(`Snapshot Proposal Id ${res.snapshotProposalId}\n`);
          success(`::: Offchain vote results submitted to the DAO`);
        })
        .catch((err) => error("Error while submitting vote results", err));
    });

  return program;
};
