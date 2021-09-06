const { ethers } = require("ethers");
const { configs } = require("./cli-config");

if (!process.env.TRUFFLE_MNEMONIC) {
  throw new Error("Please set your TRUFFLE_MNEMONIC in a .env file");
}
const mnemonic = process.env.TRUFFLE_MNEMONIC;

module.exports = {
  defaultNetwork: "ganache",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      network_id: "1337",
      accounts: {
        count: 10,
        initialIndex: 0,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
    rinkeby: {
      provider: () => {
        const provider = ethers.getDefaultProvider(network, {
          alchemyKey: configs.alchemyApiKey
            ? configs.alchemyApiKey
            : configs.infuraApiKey,
        });
        return provider;
      },
      network_id: 4,
      skipDryRun: true,
      networkCheckTimeout: 10000,
      deploymentPollingInterval: 10000,
    },
    mainnet: {
      provider: () => {
        const provider = ethers.getDefaultProvider(network, {
          alchemyKey: configs.alchemyApiKey
            ? configs.alchemyApiKey
            : configs.infuraApiKey,
        });
        return provider;
      },
      network_id: 1,
      skipDryRun: true,
    },
  },
  solidity: {
    version: "0.8.0",
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
