const inquirer = require("inquirer");

const {
  submitManagingProposal,
  processManagingProposal,
} = require("../../../contracts/adapters/managing-adapter");
const {
  bankAclFlags,
} = require("../../../contracts/extensions/bank-extension");

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
    .command("managing-proposal <adapterId> <adapterAddress> [keys] [values]")
    .description("Submit a new managing proposal.")
    .action(async (adapterName, adapterAddress, keys, values) => {
      const { updateType } = await inquirer.prompt([
        {
          type: "list",
          message: "Which type of contract do you want to update?",
          name: "updateType",
          choices: [
            {
              name: "Adapter",
              value: 1,
              description: "If you want to Add/Remove/Update adapters",
            },
            {
              name: "Extension",
              value: 2,
              description: "If want to Add/Remove/Update extensions",
            },
          ],
        },
      ]);

      const { daoAclFlags } = await inquirer.prompt([
        {
          type: "checkbox",
          message: "Select the **DAO** ACL Flags",
          name: "daoAclFlags",
          choices: daoAccessFlags.map((f) => Object.assign({ name: f })),
        },
      ]);

      const allExtensions = [
        {
          name: "Bank",
          id: "bank",
          aclFlags: bankAclFlags,
          selectedFlags: [],
        },
      ];

      const { requiredExtensions } = await inquirer.prompt([
        {
          type: "checkbox",
          message: `Select the extensions that will be used by the ${
            updateType === 1 ? "Adapter" : "Extension"
          }`,
          name: "requiredExtensions",
          choices: allExtensions,
        },
      ]);

      const extensions = await requiredExtensions
        .flatMap((name) => allExtensions.filter((ext) => ext.name === name))
        .reduce(async (res, extension) => {
          const { flags } = await inquirer.prompt([
            {
              type: "checkbox",
              message: `Select the **${extension.name}** ACL Flags`,
              name: "flags",
              choices: extension.aclFlags.map((f) =>
                Object.assign({ name: f })
              ),
            },
          ]);
          if (flags && flags.length > 0) {
            res.push({ ...extension, selectedFlags: flags });
          }
          return res;
        }, []);

      notice(`\n ::: Submitting Managing proposal...\n`);
      logEnvConfigs(configs);
      info(`Adapter:\t\t${adapterName} @ ${adapterAddress}`);
      info(`AccessFlags:\t\t${JSON.stringify(daoAclFlags)}`);
      info(`Keys:\t\t\t${keys ? keys : "n/a"}`);
      info(`Values:\t\t\t${values ? values : "n/a"}`);
      info(
        `Extensions:\t\t${
          extensions
            ? JSON.stringify(
                extensions.map((e) =>
                  Object.assign({ [e.name]: e.selectedFlags })
                )
              )
            : "n/a"
        }\n`
      );

      return submitManagingProposal(
        updateType,
        adapterName,
        adapterAddress,
        daoAclFlags,
        extensions,
        keys,
        values,
        program.opts()
      )
        .then((data) => {
          success(`New Snapshot Proposal Id: ${data.snapshotProposalId}\n`);
          notice(`::: Managing proposal submitted!\n`);
        })
        .catch((err) => error("Error while submitting managing proposal", err));
    });

  program
    .command("managing-process <snapshotProposalId>")
    .description("Process an existing managing proposal.")
    .action(async (snapshotProposalId) => {
      const daoProposalId = sha3(snapshotProposalId);

      notice(`\n::: Processing Managing proposal...\n`);
      logEnvConfigs(configs);
      info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
      info(`DAO Proposal Id:\t${daoProposalId}`);

      return processManagingProposal(daoProposalId)
        .then((res) => {
          success(`\n::: Processed Managing proposal\n`);
        })
        .catch((err) => error("Error while processing managing proposal", err));
    });

  return program;
};

module.exports = { managingCommands };
