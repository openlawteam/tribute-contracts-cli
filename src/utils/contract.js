import hre from "hardhat";
import { ethers } from "ethers";
import { configs } from "../../cli-config.js";
import { getNetworkDetails } from "tribute-contracts/utils/deployment-util.js";

export const openWallet = (provider) => {
  // The Wallet class inherits Signer and can sign transactions
  // and messages using a private key as a standard Externally Owned Account (EOA).
  const wallet = ethers.Wallet.fromMnemonic(configs.mnemonic);
  return wallet.connect(provider);
};

export const getProvider = (network) => {
  if (!network)
    throw new Error("Unable to get the provider due to invalid network");

  switch (network) {
    case "rinkeby":
      return ethers.getDefaultProvider(network, {
        url: configs.ethBlockchainApi,
        network: {
          chainId: 4,
        },
      });
    case "mainnet":
      return ethers.getDefaultProvider(network, {
        url: configs.ethBlockchainApi,
        network: {
          chainId: 1,
        },
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

export const getABI = (contractName) => {
  const artifact = hre.artifacts.readArtifactSync(contractName);
  return artifact.abi;
};

export const attachContract = (address, abi, wallet) => {
  const contract = new ethers.Contract(address, abi, wallet);
  return contract.connect(wallet);
};

export const getContract = (name, contract) => {
  const provider = getProvider(configs.network);
  const wallet = openWallet(provider);
  return {
    contract: attachContract(contract, getABI(name), wallet),
    provider,
    wallet,
  };
};
