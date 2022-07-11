import { sha3 } from "tribute-contracts/utils/contract-util.js";
import { adaptersIdsMap } from "tribute-contracts/utils/dao-ids-util.js";
import {
  entryDao,
  getEnabledExtensionFlags,
} from "tribute-contracts/utils/access-control-util.js";
import { configs } from "../../../cli-config.js";
import { getAdapter } from "../../utils/contract.js";
import { parseConfigs } from "./configuration-adapter.js";
import { GcpKmsSigner, TypedDataVersion } from "ethers-gcp-kms-signer";
import { availableExtensions } from "./managing-adapter";
import { getAdapterAddress } from "../core/dao-registry.js";

const CONTRACT_NAME = "Manager";

export const submitAndProcessProposal = async ({
  adapterOrExtensionId,
  adapterOrExtensionAddress,
  updateType,
  aclFlags,
  numericConfigKeys,
  numericConfigValues,
  extensions,
  configurations,
}) => {
  const configKeys = numericConfigKeys
    ? numericConfigKeys.map((k) => sha3(k))
    : [];
  const configValues = numericConfigValues ? numericConfigValues : [];
  const configAclFlags = aclFlags ? new Array(...aclFlags) : new Array();
  const { extensionAddresses, extensionAclFlags } = Object.values(
    extensions
  ).reduce(
    (acc, e) => {
      acc.extensionAddresses.push(e.data.address);
      const allAclsForExtension = availableExtensions[e.extensionId];
      acc.extensionAclFlags.push(
        getEnabledExtensionFlags(
          allAclsForExtension,
          e.extensionId,
          e.data.address,
          { extensions: { [e.extensionId]: e.data.flags } }
        ).flags
      );
      return acc;
    },
    { extensionAddresses: [], extensionAclFlags: [] }
  );
  const daoConfigurations = configurations ? parseConfigs(configurations) : [];

  const { contract: managerAdapter, provider } = await getAdapter(
    adaptersIdsMap.MANAGER_ADAPTER,
    CONTRACT_NAME
  );
  const { chainId } = await provider.getNetwork();
  const nonce = (await managerAdapter.nonces(configs.dao)).toNumber() + 1;

  const flags = entryDao(adapterOrExtensionId, adapterOrExtensionAddress, {
    dao: configAclFlags,
  }).flags;
  const updateTypeResolved = await parseUpdateType(updateType);

  const proposal = {
    adapterOrExtensionId: sha3(adapterOrExtensionId),
    adapterOrExtensionAddr: adapterOrExtensionAddress,
    flags,
    updateType: updateTypeResolved,
    keys: configKeys,
    values: configValues,
    extensionAddresses,
    extensionAclFlags,
  };

  const signature = await getSignature(
    {
      daoAddress: configs.dao,
      proposal,
      configs: daoConfigurations,
      nonce,
    },
    managerAdapter.address,
    chainId
  );

  await managerAdapter.processSignedProposal(
    configs.dao,
    proposal,
    daoConfigurations,
    nonce,
    signature,
    { gasLimit: 2100000 }
  );

  const updatedAddress = await getAdapterAddress(adapterOrExtensionId);
  return { updatedAddress };
};

const getSignature = async (
  proposalCouponData,
  managerAdapterAddress,
  chainId
) => {
  const domain = {
    name: "Snapshot Message",
    version: "4",
    chainId,
    verifyingContract: configs.dao,
    actionId: managerAdapterAddress,
  };
  const types = {
    Message: [
      { name: "daoAddress", type: "address" },
      { name: "proposal", type: "ProposalDetails" },
      { name: "configs", type: "Configuration[]" },
      { name: "nonce", type: "uint256" },
    ],
    ProposalDetails: [
      { name: "adapterOrExtensionId", type: "bytes32" },
      { name: "adapterOrExtensionAddr", type: "address" },
      { name: "updateType", type: "uint8" },
      { name: "flags", type: "uint128" },
      { name: "keys", type: "bytes32[]" },
      { name: "values", type: "uint256[]" },
      { name: "extensionAddresses", type: "address[]" },
      { name: "extensionAclFlags", type: "uint128[]" },
    ],
    Configuration: [
      { name: "key", type: "bytes32" },
      { name: "numericValue", type: "uint256" },
      { name: "addressValue", type: "address" },
      { name: "configType", type: "uint8" },
    ],
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
      { name: "actionId", type: "address" },
    ],
  };

  const signer = new GcpKmsSigner(configs.kmsCredentials);
  const signature = await signer.signTypedData({
    data: {
      types,
      primaryType: "Message",
      domain,
      message: proposalCouponData,
    },
    version: TypedDataVersion.V4,
  });

  return signature;
};

const parseUpdateType = async (value) => {
  switch (value) {
    case "Adapter":
      return 1;
    case "Extension":
      return 2;
    case "Configs":
      return 3;
    default:
      throw Error(`Unknown update type: ${value}`);
  }
};
