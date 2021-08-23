import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, ".env") });

import "@nomiclabs/hardhat-waffle";
// import "hardhat-typechain";
import "@nomiclabs/hardhat-ganache";

if (!process.env.TRUFFLE_MNEMONIC) {
  throw new Error("Please set your TRUFFLE_MNEMONIC in a .env file");
}
const mnemonic = process.env.TRUFFLE_MNEMONIC;

if (!process.env.INFURA_KEY || !process.env.ALCHEMY_KEY) {
  throw new Error("Please set your INFURA_KEY or ALCHEMY_KEY in a .env file");
}

const config = {
  // https://hardhat.org/config/#path-configuration
  paths: {
    tests: "./test",
    sources: "./node_modules/tribute-contracts/contracts",
    artifacts: "./build/contracts",
  },
  defaultNetwork: "ganache",
  networks: {
    ganache: {
      network_id: "1337",
      accounts: {
        count: 10,
        initialIndex: 0,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
      url: "http://localhost:7545",
    },
  },
  solidity: {
    version: "0.8.0",
    settings: {
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
