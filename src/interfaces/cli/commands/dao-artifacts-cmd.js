import inquirer from "inquirer";
import {
  getOwner,
  getArtifactAddress,
  addArtifact,
} from "../../../contracts/core/dao-artifacts.js";

import { success, notice, info, error } from "../../../utils/logging.js";

export const daoArtifactsCommands = (program) => {
  const getArtifactType = async () => {
    return await inquirer.prompt([
      {
        type: "list",
        message: "Which type of contract artifact do you want to add?",
        name: "artifactType",
        loop: false,
        choices: [
          {
            name: "Core",
            value: 0,
          },
          {
            name: "Factory",
            value: 1,
          },
          {
            name: "Extension",
            value: 2,
          },
          {
            name: "Adapter",
            value: 3,
          },
          {
            name: "Util",
            value: 4,
          },
        ],
      },
    ]);
  };

  program
    .command("dao-artifacts-owner <daoArtifactsAddr>")
    .description("Gets the adapter address if configured in the DAO.")
    .action((daoArtifactsAddr) => {
      notice(`\n ::: Get DaoArtifacts owner address...\n`);
      info(`DaoArtifacts:\t\t${daoArtifactsAddr}`);

      return getOwner(daoArtifactsAddr)
        .then((data) => {
          success(`Owner Address: \t\t${data}\n`);
        })
        .catch((err) => error("Error while getting the owner address", err));
    });

  program
    .command("dao-artifacts-add <daoArtifactsAddr> <id> <version> <address>")
    .description("Adds the artifact to the DaoArtifacts contract.")
    .action(async (daoArtifactsAddr, id, version, address) => {
      notice(`\n ::: Adding an artifact to DaoArtifacts...\n`);

      const { artifactType } = await getArtifactType();

      info(`DaoArtifacts:\t\t${daoArtifactsAddr}`);

      return addArtifact(id, version, address, artifactType, daoArtifactsAddr)
        .then(() => success(`New Artifact Added: \t\t${address}\n`))
        .catch((err) => error("Error while adding new artifact", err));
    });

  program
    .command("dao-artifacts-get <daoArtifactsAddr> <id> <owner> <version>")
    .description(
      "Gets the artifact address if present in the DaoArtifacts contract."
    )
    .action(async (daoArtifactsAddr, id, version, owner) => {
      notice(`\n ::: Get artifact address...\n`);
      const { artifactType } = await getArtifactType();

      info(`DaoArtifacts:\t\t${daoArtifactsAddr}`);

      return getArtifactAddress(
        id,
        owner,
        version,
        artifactType,
        daoArtifactsAddr
      )
        .then((artifactAddress) =>
          success(`Artifact Address: \t${artifactAddress}\n`)
        )
        .catch((err) => error("Error while adding new artifact", err));
    });

  return program;
};

module.exports = { daoArtifactsCommands };
