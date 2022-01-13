import inquirer from "inquirer";
import { ethers } from "ethers";
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
    .command("config-proposal")
    .description("Submit a new Configuration proposal.")
    .action(async () => {
      notice(`\n::: Submitting Configuration proposal...\n`);

      const configurations = await collectConfigs([]);

      return submitConfigurationProposal({
        configurations,
      })
        .then((res) => {
          success(`New Snapshot Proposal Id: ${res.snapshotProposalId}\n`);
          success(`\n::: Configuration proposal submitted!\n`, true);
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

      return processConfigurationProposal({ daoProposalId })
        .then((res) => {
          success(`\n::: Processed Configuration proposal\n`, true);
        })
        .catch((err) =>
          error("Error while processing configuration proposal", err)
        );
    });

  return program;
};

export const collectConfigs = async (inputs = []) => {
  const prompts = [
    {
      type: "input",
      name: "configKey",
      message: `Type the configuration name:`,
    },
    {
      type: "list",
      name: "configType",
      message: `Which type of configuration do you want to update?`,
      choices: ["Numeric", "Address"],
    },
    {
      type: "input",
      name: "configValue",
      message: (answers) =>
        `Type the ${answers.configType} configuration value:`,
      validate: (input, answers) => {
        switch (answers.configType) {
          case "Numeric": {
            if (ethers.BigNumber.from(input)) return true;
            return "Not a number";
          }
          case "Address": {
            if (ethers.utils.isAddress(input)) return true;
            return "Not an ethereum address";
          }
          default:
            return "Invalid config value";
        }
      },
    },
    {
      type: "confirm",
      name: "repeat",
      message: "Enter another config? ",
      default: false,
    },
  ];

  const { repeat, ...answers } = await inquirer.prompt(prompts);
  const newInputs = [...inputs, answers];
  return repeat ? collectConfigs(newInputs) : newInputs;
};
