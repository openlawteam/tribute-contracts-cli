import inquirer from "inquirer";
import { sha3 } from "tribute-contracts/utils/ContractUtil.js";
import { configs } from "../../../../cli.config.js";
import {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} from "../../../utils/logging.js";
import {
  submitManagingProposal,
  processManagingProposal,
} from "../../../contracts/adapters/managing-adapter.js";
import { daoAccessFlags } from "../../../contracts/core/dao-registry.js";

export const managingCommands = (program) => {
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
        .then((anwsers) => {
          notice(`\n ::: Submitting Managing proposal...\n`);
          logEnvConfigs(configs, configs.contracts.ManagingContract);
          info(`Adapter:\t\t${adapterName} @ ${adapterAddress}`);
          info(`AccessFlags:\t\t${JSON.stringify(anwsers.aclFlags)}`);
          info(`Keys:\t\t\t${keys ? keys : "n/a"}`);
          info(`Values:\t\t\t${values ? values : "n/a"}`);
          info(`Data:\t\t\t${data ? data : "n/a"}\n`);

          return submitManagingProposal({
            adapterName,
            adapterAddress,
            aclFlags: anwsers.aclFlags,
            keys,
            values,
            data,
            opts: program.opts(),
          });
        })
        .then((data) => {
          success(`New Snapshot Proposal Id: ${data.snapshotProposalId}\n`);
          notice(`::: Managing proposal submitted!\n`);
        })
        .catch((err) => error("Error while submitting managing proposal", err));
    });

  program
    .command("process-managing-proposal <snapshotProposalId>")
    .description("Process an existing managing proposal.")
    .action(async (snapshotProposalId) => {
      const daoProposalId = sha3(snapshotProposalId);

      notice(`\n::: Processing Managing proposal...\n`);
      logEnvConfigs(configs, configs.contracts.ManagingContract);
      info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
      info(`DAO Proposal Id:\t${daoProposalId}`);

      return processManagingProposal(
        snapshotProposalId,
        daoProposalId,
        program.opts()
      )
        .then((res) => {
          success(`\n::: Processed Managing proposal\n`);
        })
        .catch((err) => error("Error while processing managing proposal", err));
    });

  return program;
};
