const inquirer = require("inquirer");

const {
  submitManagingProposal,
  processManagingProposal,
} = require("../../adapters/managing-adapter");

const { daoAccessFlags } = require("../../core/dao-registry");

const managingCommands = (program) => {
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
        .then((anwsers) =>
          submitManagingProposal(
            adapterName,
            adapterAddress,
            anwsers.aclFlags,
            keys,
            values,
            data,
            program.opts()
          )
        );
    });

  program
    .command("process-managing-proposal <proposalId>")
    .description("Process an existing managing proposal.")
    .action((proposalId) =>
      processManagingProposal(proposalId, program.opts())
    );

  return program;
};

module.exports = { managingCommands };
