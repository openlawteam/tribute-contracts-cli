const { configs } = require("../../../../cli-config");
const {
  getAdapterAddress,
  getDAOConfig,
} = require("../../../contracts/core/dao-registry");
const {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} = require("../../../utils/logging");
const { sha3 } = require("tribute-contracts/utils/ContractUtil");

const daoRegistryCommands = (program) => {
  program
    .command("get-adapter-addr <adapterId>")
    .description("Gets the adapter address if configured in the DAO.")
    .action((adapterId) => {
      notice(`\n ::: Get adapter address...\n`);
      logEnvConfigs(configs);
      info(`AdapterId:\t\t${adapterId}`);

      return getAdapterAddress(sha3(adapterId))
        .then((data) => {
          success(`Adapter Address: \t${data}\n`);
        })
        .catch((err) => error("Error while getting the adapter address", err));
    });

  program
    .command("get-config <configName>")
    .description("Gets the configuration value from the DAO.")
    .action((configName) => {
      notice(`\n ::: Get configuration value...\n`);
      logEnvConfigs(configs);
      info(`Config:\t\t\t${configName}`);

      return getDAOConfig(configName)
        .then((data) => {
          success(`Value: \t\t\t${data}\n`);
        })
        .catch((err) => error("Error while getting the config value", err));
    });

  return program;
};

module.exports = { daoRegistryCommands };
