const { signTypedData_v4 } = require("eth-sig-util");
const {
  getDomainDefinition,
  prepareMessage,
} = require("@openlaw/snapshot-js-erc712");

const SignerV4 = (privateKeyStr) => {
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

module.exports = { SignerV4 };
