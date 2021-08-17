const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { getContract } = require("../utils/contract");
const { configs } = require("../../cli-config");

const getPriorAmount = (data) => {
  const { contract } = getContract(
    "BankExtension",
    configs.network,
    configs.contracts.BankExtension
  );
  return await contract.
};

module.exports = { daoAccessFlags, getDAOConfig, parseDaoFlags };
