const hre = require("hardhat");
const { ethers } = require("ethers");
const { configs } = require("../../cli-config");
const { getNetworkDetails } = require("tribute-contracts/utils/DeploymentUtil");

const openWallet = (provider) => {
  // The Wallet class inherits Signer and can sign transactions
  // and messages using a private key as a standard Externally Owned Account (EOA).
  const wallet = ethers.Wallet.fromMnemonic(configs.truffleMnemonic);
  return wallet.connect(provider);
};

const getProvider = (network) => {
  if (!network)
    throw new Error("Unable to get the provider due to invalid network");

  switch (network) {
    case "rinkeby":
    case "mainnet":
      return ethers.getDefaultProvider(network, {
        infura: configs.infuraApiKey,
        alchemy: configs.alchemyApiKey,
      });

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
  const artifact = hre.artifacts.readArtifactSync(contractName);
  return artifact.abi;
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
