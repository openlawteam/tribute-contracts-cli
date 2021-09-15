const { configs } = require("../../../../cli-config");
const {
  getAdapterAddress,
  getExtensionAddress,
} = require("../../../contracts/core/dao-registry");
const {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} = require("../../../utils/logging");

const daoRegistryCommands = (program) => {
  program
    .command("get-adapter-addr <adapterId>")
    .description("Gets the adapter address if configured in the DAO.")
    .action((adapterId) => {
      notice(`\n ::: Get adapter address...\n`);
      logEnvConfigs(configs);
      info(`AdapterId:\t\t${adapterId}`);

      return getAdapterAddress(adapterId)
        .then((data) => {
          success(`Adapter Address: \t${data}\n`);
        })
        .catch((err) => error("Error while getting the adapter address", err));
    });

  program
    .command("get-extension-addr <extensionId>")
    .description("Gets the extension address if configured in the DAO.")
    .action((extensionId) => {
      notice(`\n ::: Get extension address...\n`);
      logEnvConfigs(configs);
      info(`ExtensionId:\t\t${extensionId}`);

      return getExtensionAddress(extensionId)
        .then((data) => {
          success(`Extension Address: \t${data}\n`);
        })
        .catch((err) =>
          error("Error while getting the extension address", err)
        );
    });

  return program;
};

module.exports = { daoRegistryCommands };
