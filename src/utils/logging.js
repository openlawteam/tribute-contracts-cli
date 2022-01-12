import chalk from "chalk";

export const info = (msg) => {
  console.log(chalk.white(msg));
};

export const warn = (msg) => {
  console.log(chalk.yellow(msg));
};

export const success = (msg) => {
  console.log(chalk.greenBright(msg));
};

export const notice = (msg) => {
  console.log(chalk.green(msg));
};

export const error = (msg, err) => {
  console.log(chalk.red(msg), err);
};

export const logEnvConfigs = (configs, contract) => {
  info(`Network:\t\t${configs.network}`);
  info(`DAO:\t\t\t${configs.dao}`);
  info(`Space:\t\t\t${configs.space}`);
  if (contract) info(`Contract:\t\t${contract}`);
};
