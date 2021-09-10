const { getContract } = require("../../utils/contract");
const { configs } = require("../../../cli-config");

// TODO import from "tribute-contracts/utils/DeploymentUtil" v2.x
const bankAclFlags = [
  "ADD_TO_BALANCE",
  "SUB_FROM_BALANCE",
  "INTERNAL_TRANSFER",
  "WITHDRAW",
  "EXECUTE",
  "REGISTER_NEW_TOKEN",
  "REGISTER_NEW_INTERNAL_TOKEN",
  "UPDATE_TOKEN",
];

// TODO import from "tribute-contracts/utils/DeploymentUtil" v2.x
const parseBankFlags = (aclFlags) => {
  return aclFlags
    .map((f) => f.toUpperCase())
    .reduce((flags, flag) => {
      if (bankAclFlags.includes(flag)) {
        return { ...flags, [flag]: true };
      }
      throw Error(`Invalid Bank Access Flag: ${flag}`);
    }, {});
};

const getBalanceOf = async (memberAddress, tokenAddr) => {
  const { contract } = getContract(
    "BankExtension",
    configs.contracts.BankExtension
  );
  return await contract.balanceOf(memberAddress, tokenAddr);
};

const getPriorAmount = async (account, tokenAddr, blockNumber) => {
  const { contract } = getContract(
    "BankExtension",
    configs.contracts.BankExtension
  );
  return await contract.getPriorAmount(account, tokenAddr, blockNumber);
};

module.exports = { bankAclFlags, getBalanceOf, getPriorAmount, parseBankFlags };
