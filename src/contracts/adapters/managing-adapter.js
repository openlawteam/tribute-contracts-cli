import Web3 from "web3";
import { prepareVoteProposalData } from "@openlaw/snapshot-js-erc712";
import { sha3 } from "tribute-contracts/utils/contract-util.js";
import {
  adaptersIdsMap,
  extensionsIdsMap,
} from "tribute-contracts/utils/dao-ids-util.js";
import {
  entryDao,
  daoAccessFlags,
  getEnabledExtensionFlags,
  bankExtensionAclFlags,
  erc721ExtensionAclFlags,
  erc1155ExtensionAclFlags,
  erc1271ExtensionAclFlags,
  executorExtensionAclFlags,
  vestingExtensionAclFlags,
  erc20ExtensionAclFlags,
} from "tribute-contracts/utils/access-control-util.js";
import { configs } from "../../../cli-config.js";
import { getAdapter } from "../../utils/contract.js";
import { submitSnapshotProposal } from "../../services/snapshot-service.js";
import { warn } from "../../utils/logging.js";
import { parseConfigs } from "./configuration-adapter.js";
import {
  checkSenderAddress,
  isProposalReadyToBeProcessed,
} from "./offchain-voting-adapter.js";

const CONTRACT_NAME = "ManagingContract";

export const submitManagingProposal = async ({
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
  const extensionAddresses = [];
  const extensionAclFlags = [];

  Object.values(extensions).forEach((e) => {
    extensionAddresses.push(e.data.address);
    const allAclsForExtension = availableExtensions[e.extensionId];
    extensionAclFlags.push(
      getEnabledExtensionFlags(
        allAclsForExtension,
        e.extensionId,
        e.data.address,
        { extensions: { [e.extensionId]: e.data.flags } }
      ).flags
    );
  });

  const daoConfigurations = configurations ? parseConfigs(configurations) : [];

  const {
    contract: managingAdapter,
    provider,
    wallet,
  } = await getAdapter(adaptersIdsMap.MANAGING_ADAPTER, CONTRACT_NAME);

  return await submitSnapshotProposal({
    title: `ContractId: ${adapterOrExtensionId}`,
    description: `Add/update contract: ${adapterOrExtensionAddress}`,
    actionId: managingAdapter.address,
    provider,
    wallet,
  }).then(async (res) => {
    const data = res.data;
    const snapshotProposalId = res.uniqueId;
    const daoProposalId = sha3(snapshotProposalId);

    if (configs.debug) warn(`Snapshot Message: ${JSON.stringify(data)}\n`);
    const message = {
      payload: {
        body: data.payload.body,
        choices: data.payload.choices,
        end: data.payload.end,
        name: data.payload.name,
        snapshot: data.payload.snapshot.toString(),
        start: data.payload.start,
      },
      submitter: wallet.address,
      sig: res.sig,
      space: data.space,
      timestamp: parseInt(data.timestamp),
    };
    if (configs.debug) warn(`DAO Message: ${JSON.stringify(message)}\n`);

    const encodedData = prepareVoteProposalData(message, new Web3(""));
    if (configs.debug) warn(`Encoded DAO message: ${encodedData}\n`);

    await checkSenderAddress({
      adapterAddress: managingAdapter.address,
      encodedData,
      sender: wallet.address,
    });

    const flags = entryDao(adapterOrExtensionId, adapterOrExtensionAddress, {
      dao: configAclFlags,
    }).flags;

    const proposalDetails = {
      adapterOrExtensionId: sha3(adapterOrExtensionId),
      adapterOrExtensionAddr: adapterOrExtensionAddress,
      flags,
      updateType: parseUpdateType(updateType),
      keys: configKeys,
      values: configValues,
      extensionAddresses,
      extensionAclFlags,
    };

    await managingAdapter.submitProposal(
      configs.dao,
      daoProposalId,
      proposalDetails,
      [...daoConfigurations],
      encodedData,
      { from: wallet.address }
    );

    return { daoProposalId, snapshotProposalId };
  });
};

export const processManagingProposal = async ({ daoProposalId }) => {
  await isProposalReadyToBeProcessed({ daoProposalId });

  const { contract: managingAdapter, wallet } = await getAdapter(
    adaptersIdsMap.MANAGING_ADAPTER,
    CONTRACT_NAME
  );

  await managingAdapter.processProposal(configs.dao, daoProposalId, {
    from: wallet.address,
  });

  return { daoProposalId };
};

export const availableExtensions = {
  [extensionsIdsMap.BANK_EXT]: bankExtensionAclFlags,
  [extensionsIdsMap.ERC1271_EXT]: erc1271ExtensionAclFlags,
  [extensionsIdsMap.ERC721_EXT]: erc721ExtensionAclFlags,
  [extensionsIdsMap.EXECUTOR_EXT]: executorExtensionAclFlags,
  [extensionsIdsMap.VESTING_EXT]: vestingExtensionAclFlags,
  [extensionsIdsMap.ERC1155_EXT]: erc1155ExtensionAclFlags,
  [extensionsIdsMap.ERC20_EXT]: erc20ExtensionAclFlags,
};

const parseUpdateType = async (value) => {
  switch (value) {
    case "Adapter":
      return 1;
    case "Extension":
      return 2;
    default:
      throw Error(`Unknown update type: ${value}`);
  }
};