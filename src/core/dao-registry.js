const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { getContract } = require("../utils/contract");

const getDAOConfig = async (configKey, daoAddress, network) => {
  const { contract } = getContract("DaoRegistry", network, daoAddress);
  return await contract.getConfiguration(sha3(configKey));
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

module.exports = { daoAccessFlags, getDAOConfig, parseDaoFlags };
