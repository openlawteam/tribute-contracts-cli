const Web3 = require("web3");
const { ethers } = require("ethers");
const toBytes32 = ethers.utils.formatBytes32String;
const { configs } = require("../../../cli-config");
const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { prepareVoteProposalData } = require("@openlaw/snapshot-js-erc712");
const { entryDao } = require("tribute-contracts/utils/DeploymentUtil");
const { getContract } = require("../../utils/contract");
const { submitSnapshotProposal } = require("../../services/snapshot-service");
const { parseDaoFlags } = require("../core/dao-registry");
const { warn } = require("../../utils/logging");
const { isProposalReadyToBeProcessed } = require("./offchain-voting-adapter");
const { parseConfigs } = require("./configuration-adapter");
const {
  aclsMap,
  getAclFlagValueForExtension,
} = require("../../utils/access-flags");

const submitManagingProposal = async ({
  adapterOrExtensionId,
  adapterOrExtensionAddress,
  updateType,
  aclFlags,
  numericConfigKeys,
  numericConfigValues,
  extensions,
  configurations,
  opts,
}) => {
  const configKeys = numericConfigKeys
    ? numericConfigKeys.map((k) => sha3(k))
    : [];
  const configValues = numericConfigValues ? numericConfigValues : [];
  const configAclFlags = aclFlags ? parseDaoFlags(aclFlags) : [];
  const extensionAddresses = [];
  const extensionAclFlags = [];
  Object.values(extensions).forEach((e) => {
    extensionAddresses.push(e.data.address);
    const allAclsForExtension = aclsMap[e.extensionId];
    extensionAclFlags.push(
      getAclFlagValueForExtension(
        e.extensionId,
        allAclsForExtension,
        e.data.flags
      )
    );
  });

  const daoConfigurations = configurations ? parseConfigs(configurations) : [];

  const { contract, provider, wallet } = getContract(
    "ManagingContract",
    configs.contracts.ManagingContract
  );

  return await submitSnapshotProposal(
    `Adapter: ${adapterOrExtensionId}`,
    "Create/Update adapter/extension",
    configs.contracts.ManagingContract,
    provider,
    wallet
  ).then(async (res) => {
    const data = res.data;
    const snapshotProposalId = res.uniqueId;
    const daoProposalId = sha3(snapshotProposalId);

    warn(`Snapshot Message: ${JSON.stringify(data)}\n`);
    const message = {
      payload: {
        body: data.payload.body,
        choices: data.payload.choices,
        end: data.payload.end,
        name: data.payload.name,
        snapshot: data.payload.snapshot.toString(),
        start: data.payload.start,
      },
      sig: res.sig,
      space: data.space,
      timestamp: parseInt(data.timestamp),
    };
    warn(`DAO Message: ${JSON.stringify(message)}\n`);

    const encodedProposalData = prepareVoteProposalData(message, new Web3(""));
    warn(`Encoded DAO message: ${encodedProposalData}\n`);

    const { contract: offchainContract } = getContract(
      "OffchainVotingContract",
      configs.contracts.OffchainVotingContract
    );

    const sender = await offchainContract.getSenderAddress(
      configs.contracts.DaoRegistry,
      configs.contracts.ManagingContract,
      encodedProposalData,
      wallet.address,
      { from: wallet.address }
    );

    if (sender !== wallet.address) {
      throw Error(
        `voting.getSenderAddress ${sender} does not match the actual wallet sender: ${wallet.address}`
      );
    }

    const proposalDetails = {
      adapterOrExtensionId: sha3(adapterOrExtensionId),
      adapterOrExtensionAddr: adapterOrExtensionAddress,
      flags: entryDao(
        adapterOrExtensionId,
        { address: adapterOrExtensionAddress },
        configAclFlags
      ).flags,
      updateType: parseUpdateType(updateType),
      keys: configKeys,
      values: configValues,
      extensionAddresses,
      extensionAclFlags,
    };

    await contract.submitProposal(
      configs.contracts.DaoRegistry,
      daoProposalId,
      proposalDetails,
      [...daoConfigurations],
      encodedProposalData,
      { from: wallet.address }
    );
    return { daoProposalId, snapshotProposalId };
  });
};

const processManagingProposal = async ({ daoProposalId }) => {
  const { contract, wallet } = getContract(
    "ManagingContract",
    configs.contracts.ManagingContract
  );

  await isProposalReadyToBeProcessed({ daoProposalId });

  await contract.processProposal(configs.contracts.DaoRegistry, daoProposalId, {
    from: wallet.address,
  });

  return { daoProposalId };
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

module.exports = { submitManagingProposal, processManagingProposal };
