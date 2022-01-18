import { configs } from "../../../../cli-config.js";
import { getPriorAmount } from "../../../contracts/extensions/bank-extension.js";
import {
  success,
  notice,
  info,
  logEnvConfigs,
  error,
} from "../../../utils/logging.js";

export const bankExtensionCommands = (program) => {
  program
    .command("get-prior-amount <account> <token> <snapshot>")
    .description("Gets the account balance at a given snapshot.")
    .action((account, token, snapshot) => {
      notice(`\n ::: Get prior amount...\n`);
      logEnvConfigs(configs);
      info(`Account:\t\t${account}`);
      info(`Token:\t\t\t${token}`);
      info(`Snapshot:\t\t${snapshot}`);

      return getPriorAmount(account, token, snapshot)
        .then((data) => {
          success(`Balance: \t\t${data}\n`);
        })
        .catch((err) => error("Error while getting the account balance", err));
    });

  return program;
};
