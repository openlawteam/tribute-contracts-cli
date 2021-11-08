const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { getContract } = require("../../utils/contract");
const { configs } = require("../../../cli-config");

const getDAOConfig = async (configKey) => {
  const { contract } = getContract("DaoRegistry", configs.dao);
  return await contract.getConfiguration(sha3(configKey));
};

const getDAOConfigAddress = async (configKey) => {
  const { contract } = getContract("DaoRegistry", configs.dao);
  return await contract.getAddressConfiguration(sha3(configKey));
};

const getAddressIfDelegated = async (memberAddress) => {
  const { contract } = getContract("DaoRegistry", configs.dao);
  return await contract.getAddressIfDelegated(memberAddress);
};

const getMemberAddress = async (memberIndex) => {
  const { contract } = getContract("DaoRegistry", configs.dao);
  return await contract.getMemberAddress(memberIndex);
};

const getAdapterAddress = async (adapterId) => {
  const { contract } = getContract("DaoRegistry", configs.dao);
  return await contract.getAdapterAddress(sha3(adapterId));
};

const getExtensionAddress = async (extensionId) => {
  const { contract } = getContract("DaoRegistry", configs.dao);
  return await contract.getExtensionAddress(sha3(extensionId));
};

module.exports = {
  getDAOConfig,
  getDAOConfigAddress,
  getAddressIfDelegated,
  getMemberAddress,
  getAdapterAddress,
  getExtensionAddress,
};
