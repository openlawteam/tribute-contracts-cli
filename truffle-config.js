const { ethers } = require("ethers");

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
        const HDWalletProvider = require("@truffle/hdwallet-provider");
        const infuraKey = process.env.INFURA_KEY;
        const alchemyKey = process.env.ALCHEMY_KEY;
        const mnemonic = process.env.TRUFFLE_MNEMONIC;

        let url;
        if (alchemyKey) {
          url = `wss://eth-rinkeby.ws.alchemyapi.io/v2/${alchemyKey}`;
        } else {
          url = `wss://rinkeby.infura.io/ws/v3/${infuraKey}`;
        }
        return ethers.getDefaultProvider(network, {
          mnemonic: {
            phrase: mnemonic,
          },
          etherscan: alchemyKey,
        });
        // return new HDWalletProvider({
        //   mnemonic: {
        //     phrase: mnemonic,
        //   },
        //   providerOrUrl: url,
        //   pollingInterval: 10000,
        // });
      },
      network_id: 4,
      skipDryRun: true,
      networkCheckTimeout: 10000,
      deploymentPollingInterval: 10000,
    },
    mainnet: {
      provider: () => {
        const HDWalletProvider = require("@truffle/hdwallet-provider");
        const infuraKey = process.env.INFURA_KEY;
        const alchemyKey = process.env.ALCHEMY_KEY;
        const mnemonic = process.env.TRUFFLE_MNEMONIC;

        let url;
        if (alchemyKey) {
          url = `wss://eth-mainnet.ws.alchemyapi.io/v2/${alchemyKey}`;
        } else {
          url = `wss://mainnet.infura.io/ws/v3/${infuraKey}`;
        }
        return new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic,
          },
          providerOrUrl: url,
        });
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
