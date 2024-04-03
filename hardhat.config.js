const { configs } = require("./cli-config.js");

module.exports = {
  defaultNetwork: "ganache",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      network_id: "1337",
      accounts: {
        count: 10,
        initialIndex: 0,
        mnemonic: configs.mnemonicOrPrivateKey,
        path: "m/44'/60'/0'/0",
      },
    },
    polygon: {
      url: configs.ethBlockchainApi,
      network_id: 137,
      skipDryRun: true,
      networkCheckTimeout: 10000,
      deploymentPollingInterval: 10000,
    },
    mainnet: {
      url: configs.ethBlockchainApi,
      network_id: 1,
      skipDryRun: true,
    },
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    tests: "./test",
    sources: "./build/contracts",
    cache: "./build/cache",
    artifacts: "./build/artifacts",
  },
  mocha: {
    timeout: 20000,
  },
};
