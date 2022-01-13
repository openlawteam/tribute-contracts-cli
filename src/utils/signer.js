import { signTypedData_v4 } from "eth-sig-util";
import {
  getDomainDefinition,
  prepareMessage,
} from "@openlaw/snapshot-js-erc712";

export const SignerV4 = (privateKeyStr) => {
  return (msg, verifyingContract, actionId, chainId) => {
    const message = prepareMessage(msg);
    if (privateKeyStr.indexOf("0x") === 0) {
      privateKeyStr = privateKeyStr.slice(2);
    }
    const privateKey = Buffer.from(privateKeyStr, "hex");
    const { domain, types } = getDomainDefinition(
      { ...message, type: msg.type },
      verifyingContract,
      actionId,
      chainId
    );
    const msgParams = {
      domain,
      message,
      primaryType: "Message",
      types,
    };
    return signTypedData_v4(privateKey, { data: msgParams });
  };
};
