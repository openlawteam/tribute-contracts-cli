const inquirer = require("inquirer");
const { ethers } = require("ethers");
const {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} = require("../../../utils/logging");
const {
  sha3,
  ZERO_ADDRESS,
} = require("tribute-contracts/utils/ContractUtil");
const { configs } = require("../../../../cli-config");
const {
  submitConfigurationProposal,
  processConfigurationProposal,
} = require("../../../contracts/adapters/configuration-adapter");

const configurationCommands = (program) => {
  program
    .command("config-proposal")
    .description("Submit a new configuration proposal.")
    .action(async () => {
      notice(`\n::: Submitting configuration proposal...\n`);
      await collectConfigs()
        .then((inputs) => {
          if (process.env.DEBUG) console.log(inputs);
          const configs = [];
          Array.from(inputs).forEach((i) => {
            if (i.configType === "Numeric") {
              configs.push({
                key: sha3(i.configKey),
                configType: 0, // Numeric
                numericValue: i.configValue,
                addressValue: ZERO_ADDRESS,
              });
            } else if (i.configType === "Address") {
              configs.push({
                key: sha3(i.configKey),
                configType: 1, // Address
                numericValue: 0,
                addressValue: ethers.utils.getAddress(i.configValue),
              });
            }
          });
          if (process.env.DEBUG) console.log(configs);

          return submitConfigurationProposal({
            configurations: configs,
            opts: program.opts(),
          });
        })
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
      logEnvConfigs(configs, configs.contracts.ConfigurationContract);
      info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
      info(`DAO Proposal Id:\t${daoProposalId}`);

      return processConfigurationProposal({ daoProposalId })
        .then((res) => {
          success(`\n::: Processed Configuration proposal\n`);
        })
        .catch((err) =>
          error("Error while processing configuration proposal", err)
        );
    });

  return program;
};

const collectConfigs = async (inputs = []) => {
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

module.exports = { configurationCommands };
