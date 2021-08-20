const { getContract } = require("../../utils/contract");
const { configs } = require("../../../cli.config");

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

module.exports = { getBalanceOf, getPriorAmount };
