const inquirer = require("inquirer");
const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { configs } = require("../../../../cli-config");

const {
  submitOffchainResult,
  newOffchainVote,
} = require("../../../contracts/adapters/offchain-voting-adapter");
const {
  logEnvConfigs,
  success,
  notice,
  info,
  error,
} = require("../../../utils/logging");

const offchainCommands = (program) => {
  program
    .command("offchain-vote <snapshotProposalId> [data]")
    .description(
      "Submits a vote to Snapshot Hub."
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
    .command("offchain-result <snapshotProposalId>")
    .description(
      "Submits the results of the voting to the DAO."
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

module.exports = { offchainCommands };
