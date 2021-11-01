const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { getContract } = require("../../utils/contract");
const { configs } = require("../../../cli-config");

const getDAOConfig = async (configKey) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getConfiguration(sha3(configKey));
};

const getDAOConfigAddress = async (configKey) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getAddressConfiguration(sha3(configKey));
};

const getAddressIfDelegated = async (memberAddress) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getAddressIfDelegated(memberAddress);
};

const getMemberAddress = async (memberIndex) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getMemberAddress(memberIndex);
};

const getAdapterAddress = async (adapterId) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getAdapterAddress(sha3(adapterId));
};

const getExtensionAddress = async (extensionId) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getExtensionAddress(sha3(extensionId));
};

// TODO import from "tribute-contracts/utils/DeploymentUtil" v2.0.3
const daoAccessFlags = [
  "REPLACE_ADAPTER",
  "SUBMIT_PROPOSAL",
  "UPDATE_DELEGATE_KEY",
  "SET_CONFIGURATION",
  "ADD_EXTENSION",
  "REMOVE_EXTENSION",
  "NEW_MEMBER",
];
// TODO import from "tribute-contracts/utils/DeploymentUtil" v2.0.3
const parseDaoFlags = (aclFlags) => {
  return aclFlags
    .map((f) => f.toUpperCase())
    .reduce((flags, flag) => {
      if (daoAccessFlags.includes(flag)) {
        return { ...flags, [flag]: true };
      }
      throw Error(`Invalid DAO Access Flag: ${flag}`);
    }, {});
};

module.exports = {
  daoAccessFlags,
  getDAOConfig,
  getDAOConfigAddress,
  parseDaoFlags,
  getAddressIfDelegated,
  getMemberAddress,
  getAdapterAddress,
  getExtensionAddress,
};
