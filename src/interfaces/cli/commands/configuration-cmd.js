import { configs } from "../../../../cli-config.js";
import {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} from "../../../utils/logging.js";
import { sha3 } from "tribute-contracts/utils/contract-util.js";
import {
  submitConfigurationProposal,
  processConfigurationProposal,
} from "../../../contracts/adapters/configuration-adapter.js";

export const configurationCommands = (program) => {
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
