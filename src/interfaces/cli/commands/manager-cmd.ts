import inquirer from "inquirer";
import { ethers } from "ethers";
import { daoAccessFlags } from "tribute-contracts/utils/access-control-util.js";
import { extensionsIdsMap } from "tribute-contracts/utils/dao-ids-util.js";
import { availableExtensions } from "../../../contracts/adapters/managing-adapter.js";
import {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} from "../../../utils/logging.js";
import { configs } from "../../../../cli-config.js";
import { collectConfigs } from "./configuration-cmd.js";
import { getExtensionAddress } from "../../../contracts/core/dao-registry.js";
import { submitAndProcessProposal } from "../../../contracts/adapters/manager-adapter.js";

export const managerCommands = (program) => {
  program
    .command(
      "manager-submitAndProcessProposal <adapterOrExtensionId> <adapterOrExtensionAddr>"
    )
    .description("Submit and process a new managing proposal.")
    .action(async (adapterOrExtensionId, adapterOrExtensionAddress) => {
      await inquirer
        .prompt([
          {
            type: "list",
            name: "updateType",
            message: `Which type of contract do you want to update?`,
            choices: ["Adapter", "Extension", "Configs"],
          },
        ])
        .then(async (answers) => {
          let aclFlags = [];
          if (answers.updateType !== "Configs") {
            aclFlags = (
              await inquirer.prompt([
                {
                  type: "checkbox",
                  message: (a) =>
                    `Which DAO permissions does the ${a.updateType} need?`,
                  name: "aclFlags",
                  choices: daoAccessFlags.map((f) =>
                    Object.assign({ name: f })
                  ),
                },
              ])
            ).aclFlags;
          }
          return { ...answers, aclFlags };
        })
        .then(async (answers) => {
          let extensions = {};
          if (answers.updateType !== "Configs") {
            extensions = (
              await promptExtensionAccessFlags(adapterOrExtensionId)
            ).extensions;
          }
          return { ...answers, extensions };
        })
        .then(async (answers) => {
          const { updateType, aclFlags, extensions } = answers;

          const { configurations } = await promptDaoConfigurations(
            adapterOrExtensionId
          );

          notice(`\n ::: Submitting and Processing Managing proposal...\n`);
          logEnvConfigs(configs);
          info(
            `Adapter:\t\t${adapterOrExtensionId} @ ${adapterOrExtensionAddress}`
          );
          info(`DAO AccessFlags:\t${JSON.stringify(answers.aclFlags)}`);
          info(
            `DAO Configurations:\t${
              configurations ? JSON.stringify(configurations) : "n/a"
            }\n`
          );
          info(
            `Extensions:\t\t${extensions ? JSON.stringify(extensions) : "n/a"}`
          );

          return submitAndProcessProposal({
            adapterOrExtensionId,
            adapterOrExtensionAddress,
            updateType,
            aclFlags,
            numericConfigKeys: [], // empty because the configs are now collected using the configurations obj
            numericConfigValues: [], // empty because the configs are now collected using the configurations obj
            extensions,
            configurations,
          });
        })
        .then((data) => {
          success(
            `adapterOrExtension: "${adapterOrExtensionId}" updated to address ${adapterOrExtensionAddress}\n`
          );
          success(`::: Managing proposal submitted and processed!\n`, true);
        })
        .catch((err) => error("Error while submitting managing proposal", err));
    });

  return program;
};

const collectExtensionAccessFlags = async (inputs = []) => {
  const prompts = [
    {
      type: "list",
      name: "extensionId",
      message: `Which extension do you want to grant access to?`,
      choices: Object.values(extensionsIdsMap),
    },
    {
      type: "checkbox",
      name: "data",
      choices: (answers) => availableExtensions[answers.extensionId],
      message: (answers) =>
        `Select the ACL Flags to grant the access to the ${answers.extensionId} extension:`,
      filter: async (selectedAclFlags, answers) => {
        const extensionAddr = await getExtensionAddress(answers.extensionId);
        return {
          address: extensionAddr,
          flags: selectedAclFlags,
        };
      },
    },
    {
      type: "confirm",
      name: "repeat",
      message: "Grant access to another extension? ",
      default: false,
    },
  ];

  const { repeat, ...answers } = await inquirer.prompt(prompts);
  const newInputs = [...inputs, answers];
  return repeat ? collectExtensionAccessFlags(newInputs) : newInputs;
};

const collectNumericConfigs = async (inputs = []) => {
  const prompts = [
    {
      type: "input",
      name: "configKey",
      message: `Type the DAO numeric configuration name:`,
    },
    {
      type: "input",
      name: "configValue",
      message: () => `Type the DAO numeric configuration value:`,
      validate: (input) => {
        if (ethers.BigNumber.from(input)) return true;
        return "Not a number";
      },
    },
    {
      type: "confirm",
      name: "repeat",
      message: "Enter another numeric config? ",
      default: false,
    },
  ];

  const { repeat, ...answers } = await inquirer.prompt(prompts);
  const newInputs = [...inputs, answers];
  return repeat ? collectNumericConfigs(newInputs) : newInputs;
};

const promptExtensionAccessFlags = async (adapterOrExtensionId) => {
  const { requiresExtAccess } = await inquirer.prompt([
    {
      type: "confirm",
      name: "requiresExtAccess",
      message: `Does the ${adapterOrExtensionId} contract require access to any extension?`,
      default: false,
    },
  ]);
  let extensions = {};
  if (requiresExtAccess) {
    extensions = await collectExtensionAccessFlags();
  }
  return { extensions };
};

const promptDaoConfigurations = async (adapterOrExtensionId) => {
  const { requiresConfigs } = await inquirer.prompt([
    {
      type: "confirm",
      name: "requiresConfigs",
      message: `Does the ${adapterOrExtensionId} contract require any DAO configuration parameter?`,
      default: false,
    },
  ]);

  const configurations = requiresConfigs ? await collectConfigs() : [];
  return { configurations };
};
