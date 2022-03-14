const inquirer = require("inquirer");

const {
  submitManagingProposal,
  processManagingProposal,
} = require("../../../contracts/adapters/managing-adapter");
const { getExtensionAddress } = require("../../../contracts/core/dao-registry");
const { aclsMap, extensionsIds } = require("../../../utils/access-flags");
const { configs } = require("../../../../cli-config");
const { daoAccessFlags } = require("../../../contracts/core/dao-registry");
const {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} = require("../../../utils/logging");
const { sha3 } = require("tribute-contracts/utils/ContractUtil");

const managingCommands = (program) => {
  program
    .command(
      "managing-proposal <adapterOrExtensionId> <adapterOrExtensionAddr>"
    )
    .description("Submit a new managing proposal.")
    .action(async (adapterOrExtensionId, adapterOrExtensionAddress) => {
      await inquirer
        .prompt([
          {
            type: "list",
            name: "updateType",
            message: `Which type of contract do you want to update?`,
            choices: ["Adapter", "Extension"],
          },
          {
            type: "checkbox",
            message: "Select the ACL Flags or hit ENTER to skip",
            message: (a) =>
              `Which DAO permissions does the ${a.updateType} need?`,
            name: "aclFlags",
            choices: daoAccessFlags.map((f) => Object.assign({ name: f })),
          },
        ])
        .then(async (answers) => {
          const { extensions } = await promptExtensionAccessFlags(
            adapterOrExtensionId
          );

          notice(`\n ::: Submitting Managing proposal...\n`);
          logEnvConfigs(configs, configs.contracts.ManagingContract);
          info(
            `Adapter:\t\t${adapterOrExtensionId} @ ${adapterOrExtensionAddress}`
          );
          info(`DAO AccessFlags:\t${JSON.stringify(answers.aclFlags)}`);
          info(
            `Extensions:\t\t${extensions ? JSON.stringify(extensions) : "n/a"}`
          );

          return submitManagingProposal({
            adapterOrExtensionId,
            adapterOrExtensionAddress,
            updateType: answers.updateType,
            aclFlags: answers.aclFlags,
            numericConfigKeys: [], //empty because we can't encode array in the ProposalDetails struct, use v1.0.6
            numericConfigValues: [], //empty because we can't encode array in the ProposalDetails struct, use v1.0.6
            extensions,
            opts: program.opts(),
          });
        })
        .then((data) => {
          success(`New Snapshot Proposal Id: ${data.snapshotProposalId}\n`);
          notice(`::: Managing proposal submitted!\n`, true);
        })
        .catch((err) => error("Error while submitting managing proposal", err));
    });

  program
    .command("managing-process <snapshotProposalId>")
    .description("Process an existing managing proposal.")
    .action(async (snapshotProposalId) => {
      const daoProposalId = sha3(snapshotProposalId);

      notice(`\n::: Processing Managing proposal...\n`);
      logEnvConfigs(configs, configs.contracts.ManagingContract);
      info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
      info(`DAO Proposal Id:\t${daoProposalId}`);

      return processManagingProposal({ daoProposalId })
        .then((res) => {
          success(`\n::: Processed Managing proposal\n`, true);
        })
        .catch((err) => error("Error while processing managing proposal", err));
    });

  return program;
};
const collectExtensionAccessFlags = async (inputs = []) => {
  const prompts = [
    {
      type: "list",
      name: "extensionId",
      message: `Which extension do you want to grant access to?`,
      choices: extensionsIds,
    },
    {
      type: "checkbox",
      name: "data",
      choices: (answers) => aclsMap[answers.extensionId],
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

const promptDaoNumericConfigs = async (adapterOrExtensionId) => {
  const { requiresNumericConfigs } = await inquirer.prompt([
    {
      type: "confirm",
      name: "requiresNumericConfigs",
      message: `Does the ${adapterOrExtensionId} contract require any <numeric> DAO configuration?`,
      default: false,
    },
  ]);

  return requiresNumericConfigs
    ? await collectNumericConfigs().then((inputs) => {
        if (process.env.DEBUG) console.log(inputs);
        const keys = [];
        const values = [];
        Array.from(inputs).forEach((i) => {
          keys.push(i.configKey);
          values.push(i.configValue);
        });
        if (process.env.DEBUG) console.log({ keys, values });

        return { keys, values };
      })
    : { keys: [], value: [] };
};

const promptExtensionAccessFlags = async (adapterOrExtensionId) => {
  const { requiresExtAccess } = await inquirer.prompt([
    {
      type: "confirm",
      name: "requiresExtAccess",
      message: `Does the ${adapterOrExtensionId} contract require access to other extensions?`,
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

module.exports = { managingCommands };
