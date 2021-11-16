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

const submitManagingProposal = async (
  adapterName,
  adapterAddress,
  aclFlags,
  keys,
  values,
  data,
  opts
) => {
  const configKeys = keys ? keys.split(",").map((k) => toBytes32(k)) : [];
  const configValues = values ? values.split(",").map((v) => v) : [];
  const configAclFlags = parseDaoFlags(aclFlags);

  const { contract, provider, wallet } = getContract(
    "ManagingContract",
    configs.contracts.ManagingContract
  );

  return await submitSnapshotProposal(
    `Adapter: ${adapterName}`,
    "Create/Update adapter",
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

    const encodedData = prepareVoteProposalData(message, new Web3(""));
    warn(`Encoded DAO message: ${encodedData}\n`);

    const { contract: offchainContract } = getContract(
      "OffchainVotingContract",
      configs.contracts.OffchainVotingContract
    );

    const sender = await offchainContract.getSenderAddress(
      configs.contracts.DaoRegistry,
      configs.contracts.ManagingContract,
      encodedData,
      wallet.address,
      { from: wallet.address }
    );

    if (sender !== wallet.address) {
      throw Error(
        `voting.getSenderAddress ${sender} does not match the actual wallet sender: ${wallet.address}`
      );
    }

    await contract.submitProposal(
      configs.contracts.DaoRegistry,
      daoProposalId,
      {
        adapterId: sha3(adapterName),
        adapterAddress: adapterAddress,
        flags: entryDao(
          adapterName,
          { address: adapterAddress },
          configAclFlags
        ).flags,
      },
      configKeys,
      configValues,
      encodedData ? encodedData : ethers.utils.toUtf8Bytes(""),
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

module.exports = { submitManagingProposal, processManagingProposal };
