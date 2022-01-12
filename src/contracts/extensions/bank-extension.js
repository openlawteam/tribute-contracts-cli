import { getContract } from "../../utils/contract.js";
import { getExtensionAddress } from "../core/dao-registry.js";

export const getBalanceOf = async (memberAddress, tokenAddr) => {
  const bankAddress = await getExtensionAddress("bank");
  const { contract } = getContract("BankExtension", bankAddress);
  return await contract.balanceOf(memberAddress, tokenAddr);
};

export const getPriorAmount = async (account, tokenAddr, blockNumber) => {
  const bankAddress = await getExtensionAddress("bank");
  const { contract } = getContract("BankExtension", bankAddress);
  return await contract.getPriorAmount(account, tokenAddr, blockNumber);
};
