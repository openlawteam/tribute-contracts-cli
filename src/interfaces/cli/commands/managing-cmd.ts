import inquirer from "inquirer";

import {
  submitManagingProposal,
  processManagingProposal,
} from "../../../contracts/adapters/managing-adapter.js";
import {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} from "../../../utils/logging.js";
import { configs } from "../../../../cli-config.js";
import { sha3 } from "tribute-contracts/utils/contract-util.js";
import {
  daoAccessFlags,
  bankExtensionAclFlags,
  erc721ExtensionAclFlags,
  erc1155ExtensionAclFlags,
  erc1271ExtensionAclFlags,
  executorExtensionAclFlags,
} from "tribute-contracts/utils/access-control-util.js";

// TODO: ideally we should fetch only the extensions that are available in the DAO,
// but for now it fine to declared all of them here, because the submission will fail
// if the extension is not configured.
const daoExtensions = [
  {
    name: "Bank",
    id: "bank",
    aclFlags: bankExtensionAclFlags,
    selectedFlags: [],
  },
  {
    name: "ERC721 - NFT",
    id: "nft",
    aclFlags: erc721ExtensionAclFlags,
    selectedFlags: [],
  },
  {
    name: "ERC1155 - FT & NFT",
    id: "erc1155-ext",
    aclFlags: erc1155ExtensionAclFlags,
    selectedFlags: [],
  },
  {
    name: "ERC1271 - Signatures",
    id: "erc1271",
    aclFlags: erc1271ExtensionAclFlags,
    selectedFlags: [],
  },

  {
    name: "Executor - Delegated Call",
    id: "executor-ext",
    aclFlags: executorExtensionAclFlags,
    selectedFlags: [],
  },
];

export const managingCommands = (program) => {
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

      const { requiredExtensions } = await inquirer.prompt([
        {
          type: "checkbox",
          message: `Select the extensions that will be used by the ${
            updateType === 1 ? "Adapter" : "Extension"
          }`,
          name: "requiredExtensions",
          choices: daoExtensions,
        },
      ]);

      const selectedExtensions = requiredExtensions.flatMap((name) =>
        daoExtensions.filter((ext) => ext.name === name)
      );

      let extensions = [];
      for (let i in selectedExtensions) {
        const extension = selectedExtensions[i];
        const { flags } = await inquirer.prompt([
          {
            type: "checkbox",
            message: `Select the **${extension.name}** ACL Flags`,
            name: "flags",
            choices: extension.aclFlags.map((f) => Object.assign({ name: f })),
            loop: false,
          },
        ]);
        if (flags && flags.length > 0) {
          extensions.push({ ...extension, selectedFlags: flags });
        }
      }

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
