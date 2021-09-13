const Web3 = require("web3");
const { ethers } = require("ethers");
const toBytes32 = ethers.utils.formatBytes32String;
const { configs } = require("../../../cli-config");

const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { prepareVoteProposalData } = require("@openlaw/snapshot-js-erc712");
const {
  entryDao,
  entryBank,
} = require("tribute-contracts/utils/DeploymentUtil");
const { getContract } = require("../../utils/contract");
const { submitSnapshotProposal } = require("../../services/snapshot-service");
const { parseDaoFlags, getExtensionAddress } = require("../core/dao-registry");
const { parseBankFlags } = require("../extensions/bank-extension");
const { warn } = require("../../utils/logging");

const submitManagingProposal = async (
  updateType,
  adapterName,
  adapterAddress,
  daoAclFlags,
  extensions,
  keys,
  values,
  opts
) => {
  const configKeys = keys ? keys.split(",").map((k) => toBytes32(k)) : [];
  const configValues = values ? values.split(",").map((v) => v) : [];
  const configAclFlags = parseDaoFlags(daoAclFlags);

  const { contract, provider, wallet } = getContract(
    "ManagingContract",
    configs.contracts.ManagingContract
  );

  let extensionAddresses = [];
  let extensionAclFlags = [];
  if (extensions && extensions.length > 0) {
    for (let i in extensions) {
      const ext = extensions[i];
      extensionAddresses.push(await getExtensionAddress(ext.id));
      switch (ext.id) {
        case "bank":
          // Convert the acl flag to the interger flag value
          extensionAclFlags.push(
            entryBank({ address: undefined }, parseBankFlags(ext.selectedFlags))
              .flags
          );
          break;
        default:
          throw Error(`ACL flag not supported for extension: ${ext.name}`);
      }
    }
  }

  const daoFlags = entryDao(
    adapterName,
    { address: adapterAddress },
    configAclFlags
  ).flags;

  return await submitSnapshotProposal(
    `Adapter: ${adapterName}`,
    "Creates/Update adapter",
    configs.contracts.ManagingContract,
    provider,
    wallet
  ).then(async (res) => {
    const data = res.data;
    const snapshotProposalId = res.uniqueId;
    const daoProposalId = sha3(snapshotProposalId);

    if (opts.debug) warn(`Snapshot Message: ${JSON.stringify(data)}\n`);
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
    if (opts.debug) warn(`DAO Message: ${JSON.stringify(message)}\n`);

    const encodedData = prepareVoteProposalData(message, new Web3(""));
    if (opts.debug) warn(`Encoded DAO message: ${encodedData}\n`);

    await contract.submitProposal(
      configs.contracts.DaoRegistry,
      daoProposalId,
      {
        adapterOrExtensionId: sha3(adapterName),
        adapterOrExtensionAddr: adapterAddress,
        updateType: updateType,
        flags: daoFlags,
        keys: configKeys,
        values: configValues,
        extensionAddresses: extensionAddresses,
        extensionAclFlags: extensionAclFlags,
      },
      encodedData ? encodedData : ethers.utils.toUtf8Bytes(""),
      { from: wallet.address }
    );

    return { daoProposalId, snapshotProposalId };
  });
};

const processManagingProposal = async (daoProposalId) => {
  const { contract, wallet } = getContract(
    "ManagingContract",
    configs.contracts.ManagingContract
  );

  await contract.processProposal(configs.contracts.DaoRegistry, daoProposalId, {
    from: wallet.address,
  });

  return { daoProposalId };
};

module.exports = { submitManagingProposal, processManagingProposal };
