const { ethers } = require("ethers");
const { configs } = require("./cli-config");

module.exports = {
  contracts_directory: "./node_modules/tribute-contracts/contracts",
  contracts_build_directory: "./build/contracts",
  networks: {
    ganache: {
      name: "ganache",
      host: "127.0.0.1",
      port: 7545,
      network_id: "1337",
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

  compilers: {
    solc: {
      version: "0.8.0", // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 10000,
        },
      },
    },
  },
};
