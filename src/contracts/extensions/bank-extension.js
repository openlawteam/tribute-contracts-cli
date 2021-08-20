import { getContract } from "../../utils/contract.js";
import { configs } from "../../../cli.config.js";

export const getBalanceOf = async (memberAddress, tokenAddr) => {
  const { contract } = getContract(
    "BankExtension",
    configs.contracts.BankExtension
  );
  return await contract.balanceOf(memberAddress, tokenAddr);
};

export const getPriorAmount = async (account, tokenAddr, blockNumber) => {
  const { contract } = getContract(
    "BankExtension",
    configs.contracts.BankExtension
  );
  return await contract.getPriorAmount(account, tokenAddr, blockNumber);
};
