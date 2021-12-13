const { sha3 } = require("tribute-contracts/utils/ContractUtil");

// FIXME - This file was copied from latest master branch of tribute-contracts.
// It will be replaced in the next releases with the correct file loaded from the dependencies.

const extensionsIdsMap = {
  BANK_EXT: "bank",
  // ERC1271_EXT: "erc1271", // not available on tribute-contract versions <= v1.0.6
  ERC721_EXT: "nft",
  EXECUTOR_EXT: "executor-ext",
  // VESTING_EXT: "internal-token-vesting-ext", // not available on tribute-contract versions <= v1.0.6
  // ERC1155_EXT: "erc1155-ext",  // not available on tribute-contract versions <= v1.0.6
  // ERC20_EXT: "erc20-ext", // does not use any acl flag
};
const extensionsIds = Object.values(extensionsIdsMap);

const daoAccessFlagsMap = {
  REPLACE_ADAPTER: "REPLACE_ADAPTER",
  SUBMIT_PROPOSAL: "SUBMIT_PROPOSAL",
  UPDATE_DELEGATE_KEY: "UPDATE_DELEGATE_KEY",
  SET_CONFIGURATION: "SET_CONFIGURATION",
  ADD_EXTENSION: "ADD_EXTENSION",
  REMOVE_EXTENSION: "REMOVE_EXTENSION",
  NEW_MEMBER: "NEW_MEMBER",
};

const daoAccessFlags = Object.values(daoAccessFlagsMap);

const bankExtensionAclFlagsMap = {
  ADD_TO_BALANCE: "ADD_TO_BALANCE",
  SUB_FROM_BALANCE: "SUB_FROM_BALANCE",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
  WITHDRAW: "WITHDRAW",
  REGISTER_NEW_TOKEN: "REGISTER_NEW_TOKEN",
  REGISTER_NEW_INTERNAL_TOKEN: "REGISTER_NEW_INTERNAL_TOKEN",
  UPDATE_TOKEN: "UPDATE_TOKEN",
};

const bankExtensionAclFlags = Object.values(bankExtensionAclFlagsMap);

const erc20ExtensionAclFlagsMap = {};

const erc20ExtensionAclFlags = Object.values(erc20ExtensionAclFlagsMap);

const erc721ExtensionAclFlagsMap = {
  WITHDRAW_NFT: "WITHDRAW_NFT",
  COLLECT_NFT: "COLLECT_NFT",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
};

const erc721ExtensionAclFlags = Object.values(erc721ExtensionAclFlagsMap);

const erc1155ExtensionAclFlagsMap = {
  WITHDRAW_NFT: "WITHDRAW_NFT",
  COLLECT_NFT: "COLLECT_NFT",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
};

const erc1155ExtensionAclFlags = Object.values(erc1155ExtensionAclFlagsMap);

const erc1271ExtensionAclFlagsMap = {
  SIGN: "SIGN",
};

const erc1271ExtensionAclFlags = Object.values(erc1271ExtensionAclFlagsMap);

const executorExtensionAclFlagsMap = {
  EXECUTE: "EXECUTE",
};

const executorExtensionAclFlags = Object.values(executorExtensionAclFlagsMap);

const vestingExtensionAclFlagsMap = {
  NEW_VESTING: "NEW_VESTING",
  REMOVE_VESTING: "REMOVE_VESTING",
};

const vestingExtensionAclFlags = Object.values(vestingExtensionAclFlagsMap);

const aclsMap = {
  [extensionsIdsMap.BANK_EXT]: bankExtensionAclFlags,
  [extensionsIdsMap.ERC1271_EXT]: erc1271ExtensionAclFlags,
  [extensionsIdsMap.ERC721_EXT]: erc721ExtensionAclFlags,
  [extensionsIdsMap.EXECUTOR_EXT]: executorExtensionAclFlags,
  [extensionsIdsMap.VESTING_EXT]: vestingExtensionAclFlags,
  [extensionsIdsMap.ERC1155_EXT]: erc1155ExtensionAclFlags,
  [extensionsIdsMap.ERC20_EXT]: erc20ExtensionAclFlags,
};

const parseSelectedFlags = (allAclFlags, selectedFlags, moduleName) => {
  return selectedFlags
    .map((f) => f.toUpperCase())
    .reduce((flags, flag) => {
      if (allAclFlags.includes(flag)) {
        return { ...flags, [flag]: true };
      }
      throw Error(`Invalid ${moduleName} Access Flag: ${flag}`);
    }, {});
};

const getAclFlagValueForExtension = (extensionId, acls, selectedAcls) => {
  if (!acls || acls.length === 0) return 0;

  const enabledFlags = acls.flatMap((flag) => {
    return (
      selectedAcls &&
      Object.keys(selectedAcls).length > 0 &&
      selectedAcls.some((f) => f === flag)
    );
  });

  return calculateFlagValue(enabledFlags);
};

/**
 * Each position in the array represents a flag, if its true it means the flag is enabled, hence
 * the access should be granted.
 * To grant the access it calculates the integer value that represents that tag in the 2**68 space.
 * @param values An array of boolean which indicate the flags that are enabled.
 * @returns a value
 */
const calculateFlagValue = (values) => {
  return values
    .map((v, idx) => (v === true ? 2 ** idx : 0))
    .reduce((a, b) => a + b);
};

module.exports = {
  extensionsIdsMap,
  extensionsIds,
  daoAccessFlagsMap,
  daoAccessFlags,
  bankExtensionAclFlagsMap,
  bankExtensionAclFlags,
  erc20ExtensionAclFlagsMap,
  erc20ExtensionAclFlags,
  erc721ExtensionAclFlagsMap,
  erc721ExtensionAclFlags,
  erc1155ExtensionAclFlagsMap,
  erc1155ExtensionAclFlags,
  erc1271ExtensionAclFlagsMap,
  erc1271ExtensionAclFlags,
  executorExtensionAclFlagsMap,
  executorExtensionAclFlags,
  vestingExtensionAclFlagsMap,
  vestingExtensionAclFlags,
  aclsMap,
  parseSelectedFlags,
  getAclFlagValueForExtension,
  calculateFlagValue,
};
