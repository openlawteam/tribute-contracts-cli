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

const error = (msg) => {
  console.log(chalk.red(msg));
};

const logEnvConfigs = (opts) => {
  info(`Network:\t\t${opts.network}`);
  info(`DAO:\t\t\t${opts.dao}`);
  info(`Space:\t\t\t${opts.space}`);
  info(`Contract:\t${opts.contract}`);
};

module.exports = { warn, success, notice, error, info, logEnvConfigs };
