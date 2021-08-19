const { getContract } = require("../utils/contract");
const { configs } = require("../../cli-config");

const getBalanceOf = async (memberAddress, token) => {
  const { contract } = getContract(
    "BankExtension",
    configs.contracts.BankExtension
  );
  return await contract.balanceOf(memberAddress, token);
};

module.exports = { getBalanceOf };
