const inquirer = require("inquirer");

const {
  submitOffchainResult,
  newOffchainVote,
} = require("../../../contracts/adapters/offchain-voting-adapter");

const offchainCommands = (program) => {
  program
    .command("new-offchain-vote <snapshotProposalId> [data]")
    .description(
      "Submit an offchain vote to Snapshot Hub using the snapshot proposal id."
    )
    .action(async (snapshotProposalId, data) => {
      await inquirer
        .prompt([
          {
            type: "list",
            name: "choice",
            message: `Vote on proposal ${snapshotProposalId}`,
            choices: ["Yes", "No"],
          },
        ])
        .then((vote) =>
          newOffchainVote(snapshotProposalId, vote.choice, data, program.opts())
        );
    });

  program
    .command("submit-offchain-result <snapshotProposalId>")
    .description(
      "Submit an offchain vote result to the DAO using the snapshot proposal id."
    )
    .action((snapshotProposalId) => submitOffchainResult(snapshotProposalId));

  return program;
};

module.exports = { offchainCommands };
