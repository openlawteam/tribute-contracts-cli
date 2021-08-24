import chalk from "chalk";

export const info = (msg: string) => {
  console.log(chalk.white(msg));
};

export const warn = (msg: string) => {
  console.log(chalk.yellow(msg));
};

export const success = (msg: string) => {
  console.log(chalk.greenBright(msg));
};

export const notice = (msg: string) => {
  console.log(chalk.green(msg));
};

export const error = (msg: string, err: Error) => {
  console.log(chalk.red(msg), err);
};

export const logEnvConfigs = (configs: any, contract: any) => {
  info(`Network:\t\t${configs.network}`);
  info(`DAO:\t\t\t${configs.contracts.DaoRegistry}`);
  info(`Space:\t\t\t${configs.space}`);
  info(`Contract:\t\t${contract}`);
};
