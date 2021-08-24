import { sha3 } from "tribute-contracts/utils/ContractUtil.js";
import { getContract } from "../../utils/contract.js";
import { configs } from "../../../cli.config.js";

export const getDAOConfig = async (configKey) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getConfiguration(sha3(configKey));
};

export const getAddressIfDelegated = async (memberAddress) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getAddressIfDelegated(memberAddress);
};

export const getMemberAddress = async (memberIndex) => {
  const { contract } = getContract(
    "DaoRegistry",
    configs.contracts.DaoRegistry
  );
  return await contract.getMemberAddress(memberIndex);
};

// TODO import from "tribute-contracts/utils/DeploymentUtil" v2.0.3
export const daoAccessFlags = [
  "REPLACE_ADAPTER",
  "SUBMIT_PROPOSAL",
  "UPDATE_DELEGATE_KEY",
  "SET_CONFIGURATION",
  "ADD_EXTENSION",
  "REMOVE_EXTENSION",
  "NEW_MEMBER",
];
// TODO import from "tribute-contracts/utils/DeploymentUtil" v2.0.3
export const parseDaoFlags = (aclFlags) => {
  return aclFlags
    .map((f) => f.toUpperCase())
    .reduce((flags, flag) => {
      if (daoAccessFlags.includes(flag)) {
        return { ...flags, [flag]: true };
      }
      throw Error(`Invalid DAO Access Flag: ${flag}`);
    }, {});
};
