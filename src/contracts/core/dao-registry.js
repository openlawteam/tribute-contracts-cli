import { sha3 } from "tribute-contracts/utils/contract-util.js";
import { getContract } from "../../utils/contract.js";
import { configs } from "../../../cli-config.js";

const CONTRACT_NAME = "DaoRegistry";

export const getDAOConfig = async (configKey) => {
  const { contract } = getContract(CONTRACT_NAME, configs.dao);
  return await contract.getConfiguration(sha3(configKey));
};

export const getDAOConfigAddress = async (configKey) => {
  const { contract } = getContract(CONTRACT_NAME, configs.dao);
  return await contract.getAddressConfiguration(sha3(configKey));
};

export const getAddressIfDelegated = async (memberAddress) => {
  const { contract } = getContract(CONTRACT_NAME, configs.dao);
  return await contract.getAddressIfDelegated(memberAddress);
};

export const getMemberAddress = async (memberIndex) => {
  const { contract } = getContract(CONTRACT_NAME, configs.dao);
  return await contract.getMemberAddress(memberIndex);
};

export const getAdapterAddress = async (adapterId) => {
  const { contract } = getContract(CONTRACT_NAME, configs.dao);
  return await contract.getAdapterAddress(sha3(adapterId));
};

export const getExtensionAddress = async (extensionId) => {
  const { contract } = getContract(CONTRACT_NAME, configs.dao);
  return await contract.getExtensionAddress(sha3(extensionId));
};

export const getAdapterAccessToExtension = async (
  adapterAddress,
  extensionAddress,
  flag
) => {
  const { contract } = getContract(CONTRACT_NAME, configs.dao);
  return await contract.hasAdapterAccessToExtension(
    adapterAddress,
    extensionAddress,
    flag
  );
};
