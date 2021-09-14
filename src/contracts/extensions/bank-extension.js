const { getContract } = require("../../utils/contract");
const { getExtensionAddress } = require("../core/dao-registry");
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
  const bankAddress = await getExtensionAddress("bank");
  const { contract } = getContract("BankExtension", bankAddress);
  return await contract.balanceOf(memberAddress, tokenAddr);
};

const getPriorAmount = async (account, tokenAddr, blockNumber) => {
  const bankAddress = await getExtensionAddress("bank");
  const { contract } = getContract("BankExtension", bankAddress);
  return await contract.getPriorAmount(account, tokenAddr, blockNumber);
};

module.exports = { bankAclFlags, getBalanceOf, getPriorAmount, parseBankFlags };
