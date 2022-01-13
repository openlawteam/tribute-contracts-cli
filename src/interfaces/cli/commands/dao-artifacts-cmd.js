import inquirer from "inquirer";
import {
  getOwner,
  getArtifactAddress,
  addArtifact,
} from "../../../contracts/core/dao-artifacts.js";

import { success, notice, info, error } from "../../../utils/logging.js";

export const daoArtifactsCommands = (program) => {
  program
    .command("get-artifacts-owner <daoArtifactsAddress>")
    .description("Gets the owner of the DaoArtifacts contract.")
    .action((daoArtifactsAddress) => {
      notice(`\n ::: Get DaoArtifacts owner address...\n`);
      info(`DaoArtifacts:\t\t${daoArtifactsAddress}`);

      return getOwner({ daoArtifactsAddress })
        .then((data) => {
          success(`Owner Address: \t\t${data}\n`);
        })
        .catch((err) => error("Error while getting the owner address", err));
    });

  program
    .command("add-artifact <daoArtifactsAddress> <id> <version> <address>")
    .description("Adds the artifact to the DaoArtifacts contract.")
    .action(async (daoArtifactsAddress, id, version, address) => {
      notice(`\n ::: Adding an artifact to DaoArtifacts...\n`);

      const { artifactType } = await getArtifactType();

      info(`DaoArtifacts:\t\t${daoArtifactsAddress}`);

      return addArtifact({
        id,
        version,
        address,
        artifactType,
        daoArtifactsAddress,
      })
        .then(() => success(`New Artifact Added: \t${address}\n`))
        .catch((err) => error("Error while adding new artifact", err));
    });

  program
    .command("get-artifact <daoArtifactsAddress> <owner> <id> <version>")
    .description(
      "Gets the artifact address if present in the DaoArtifacts contract."
    )
    .action(async (daoArtifactsAddress, owner, id, version) => {
      notice(`\n ::: Get artifact address...\n`);
      const { artifactType } = await getArtifactType();

      info(`DaoArtifacts:\t\t${daoArtifactsAddress}`);

      return getArtifactAddress({
        id,
        owner,
        version,
        artifactType,
        daoArtifactsAddress,
      })
        .then((artifactAddress) =>
          success(`Artifact Address: \t${artifactAddress}\n`)
        )
        .catch((err) => error("Error while adding new artifact", err));
    });

  return program;
};

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

module.exports = { daoArtifactsCommands };
