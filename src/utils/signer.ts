import { signTypedData_v4 } from "eth-sig-util";
import {
  getDomainDefinition,
  prepareMessage,
} from "@openlaw/snapshot-js-erc712";
import { MessageWithType } from "@openlaw/snapshot-js-erc712/dist/types";

export const SignerV4 = (privateKeyStr: string) => {
  return function (
    msg: MessageWithType,
    verifyingContract: string,
    actionId: string,
    chainId: number
  ) {
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
    return signTypedData_v4(privateKey, {
      data: {
        domain,
        message,
        primaryType: "Message",
        types,
      },
    });
  };
};
