import { configs } from "../../../../cli-config.js";
import {
  getAdapterAddress,
  getExtensionAddress,
  getDAOConfig,
  getDAOConfigAddress,
  getMemberAddress,
  getDAOConfigWithTokenAddrHash,
} from "../../../contracts/core/dao-registry.js";
import {
  KycOnboardingKeys,
  OffchainVotingKeys,
} from "../../../utils/dao-configs";
import {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} from "../../../utils/logging.js";

export const daoRegistryCommands = (program) => {
  program
    .command("get-member-addr <index>")
    .description("Gets the member address from the DAO based on the index.")
    .action((index) => {
      notice(`\n ::: Get member address...\n`);
      logEnvConfigs(configs);
      info(`Index:\t\t\t${index}`);

      return getMemberAddress(index)
        .then((data) => {
          success(`Address: \t\t${data}\n`);
        })
        .catch((err) => error("Error while getting the member address", err));
    });

  program
    .command("get-adapter <adapterId>")
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
    .command("get-extension <extensionId>")
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

  program
    .command("get-config-addr <configName>")
    .description("Gets the configuration address value from the DAO.")
    .action((configName) => {
      notice(`\n ::: Get configuration address...\n`);
      logEnvConfigs(configs);
      info(`Config:\t\t\t${configName}`);

      return getDAOConfigAddress(configName)
        .then((data) => {
          success(`Address: \t\t${data}\n`);
        })
        .catch((err) => error("Error while getting the config address", err));
    });

  program
    .command("get-kyc-configs [useOldKeys]")
    .description("Gets all the kys configurations from the DAO.")
    .action(async (useOldKeys) => {
      notice(`\n ::: Get kyc configurations...\n`);
      logEnvConfigs(configs);
      info(`Configs: `);
      return await Promise.all(
        KycOnboardingKeys.map(async (config) => {
          if (config.type === "address") {
            const value = await (useOldKeys
              ? getDAOConfigAddress(config.name)
              : getDAOConfigWithTokenAddrHash(config.name, true));
            info(`  ${config.name}: ${value}`);
            return { name: config.name, value };
          } else {
            const value = await (useOldKeys
              ? getDAOConfig(config.name)
              : getDAOConfigWithTokenAddrHash(config.name, false));
            info(`  ${config.name}: ${value}`);
            return { name: config.name, value };
          }
        })
      ).then(() => {
        success(`\n`, true);
      });
    });

  program
    .command("get-voting-configs")
    .description("Gets all the voting configurations from the DAO.")
    .action(async () => {
      notice(`\n ::: Get voting configurations...\n`);
      logEnvConfigs(configs);
      info(`Configs: `);
      return await Promise.all(
        OffchainVotingKeys.map(async (config) => {
          if (config.type === "address") {
            let value = await getDAOConfigAddress(config.name);
            info(`  ${config.name}: ${value}`);
            return { name: config.name, value };
          } else {
            let value = await getDAOConfig(config.name);
            info(`  ${config.name}: ${value}`);
            return { name: config.name, value };
          }
        })
      ).then(() => {
        success(`\n`, true);
      });
    });

  return program;
};
