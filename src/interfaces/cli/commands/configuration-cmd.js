const { configs } = require("../../../../cli-config");
const {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} = require("../../../utils/logging");
const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const {
  submitConfigurationProposal,
  processConfigurationProposal,
} = require("../../../contracts/adapters/configuration-adapter");

const configurationCommands = (program) => {
  program
    .command("config-proposal <key> <value>")
    .description("Submit a new Configuration proposal.")
    .action(async (key, value) => {
      notice(`\n::: Submitting Configuration proposal...\n`);
      return submitConfigurationProposal(key, value, program.opts())
        .then((res) => {
          success(`New Snapshot Proposal Id: ${res.snapshotProposalId}\n`);
          success(`\n::: Configuration proposal submitted!\n`);
        })
        .catch((err) =>
          error("Error while processing configuration proposal", err)
        );
    });
  program
    .command("config-process <snapshotProposalId>")
    .description("Process an existing configuration proposal.")
    .action(async (snapshotProposalId) => {
      const daoProposalId = sha3(snapshotProposalId);

      notice(`\n::: Processing Configuration proposal...\n`);
      logEnvConfigs(configs);
      info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
      info(`DAO Proposal Id:\t${daoProposalId}`);

      return processConfigurationProposal(daoProposalId)
        .then((res) => {
          success(`\n::: Processed Configuration proposal\n`);
        })
        .catch((err) =>
          error("Error while processing configuration proposal", err)
        );
    });

  return program;
};

module.exports = { configurationCommands };
