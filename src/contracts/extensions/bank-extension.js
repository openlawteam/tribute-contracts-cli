const { getContract } = require("../../utils/contract");
const { getExtensionAddress } = require("../core/dao-registry");

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

module.exports = { getBalanceOf, getPriorAmount };
