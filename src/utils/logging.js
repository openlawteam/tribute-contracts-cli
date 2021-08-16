const chalk = require("chalk");

const info = (msg) => {
  console.log(chalk.white(msg));
};

const warn = (msg) => {
  console.log(chalk.yellow(msg));
};

const success = (msg) => {
  console.log(chalk.greenBright(msg));
};

const notice = (msg) => {
  console.log(chalk.green(msg));
};

const error = (msg, err) => {
  console.log(chalk.red(msg), err);
};

const logEnvConfigs = (configs, contract) => {
  info(`Network:\t\t${configs.network}`);
  info(`DAO:\t\t\t${configs.contracts.DaoRegistry}`);
  info(`Space:\t\t\t${configs.space}`);
  info(`Contract:\t\t${contract}`);
};

module.exports = { warn, success, notice, error, info, logEnvConfigs };
