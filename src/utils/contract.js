const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { configs } = require("../../cli-config");
const { getNetworkDetails } = require("tribute-contracts/utils/DeploymentUtil");

const openWallet = (provider) => {
  // The Wallet class inherits Signer and can sign transactions
  // and messages using a private key as a standard Externally Owned Account (EOA).
  let wallet;
  try {
    wallet = ethers.Wallet.fromMnemonic(configs.truffleMnemonic);
  } catch (e) {
    wallet = new ethers.Wallet(configs.truffleMnemonic);
  }
  return wallet.connect(provider);
};

const getProvider = (network) => {
  if (!network)
    throw new Error("Unable to get the provider due to invalid network");

  switch (network) {
    case "rinkeby":
    case "mainnet": {
      if (configs.alchemyApiKey)
        return new ethers.providers.AlchemyProvider(
          network,
          configs.alchemyApiKey
        );
      if (configs.infuraApiKey)
        return new ethers.providers.InfuraProvider(
          network,
          configs.infuraApiKey
        );

      return ethers.getDefaultProvider(network);
    }

    case "ganache":
    default:
      // Using the same network config as truffle-config.js
      return new ethers.providers.JsonRpcProvider({
        url: configs.ganacheUrl,
        network: {
          chainId: getNetworkDetails(network).chainId,
          name: network,
        },
      });
  }
};

const getABI = (contractName) => {
  const contract = JSON.parse(
    fs.readFileSync(
      path.resolve(`build/contracts/${contractName}.json`),
      "utf8"
    )
  );
  return contract.abi;
};

const attachContract = (address, abi, wallet) => {
  const contract = new ethers.Contract(address, abi, wallet);
  return contract.connect(wallet);
};

const getContract = (name, contract) => {
  const provider = getProvider(configs.network);
  const wallet = openWallet(provider);
  return {
    contract: attachContract(contract, getABI(name), wallet),
    provider,
    wallet,
  };
};

module.exports = { attachContract, getContract };
