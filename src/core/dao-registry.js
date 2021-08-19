const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { getContract } = require("../utils/contract");
const { configs } = require("../../cli-config");

const getDAOConfig = async (configKey) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getConfiguration(sha3(configKey));
};

const getAddressIfDelegated = async (memberAddress) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getAddressIfDelegated(memberAddress);
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
  parseDaoFlags,
  getAddressIfDelegated,
};
