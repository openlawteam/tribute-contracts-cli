const Web3 = require("web3");
const { ethers } = require("ethers");
const { configs } = require("../../../cli-config");
const { sha3, toBN } = require("tribute-contracts/utils/ContractUtil");
const { prepareVoteProposalData } = require("@openlaw/snapshot-js-erc712");
const { getContract } = require("../../utils/contract");
const { submitSnapshotProposal } = require("../../services/snapshot-service");
const { warn } = require("../../utils/logging");
const { isProposalReadyToBeProcessed } = require("./offchain-voting-adapter");

const submitConfigurationProposal = async ({ configurations, opts }) => {
  const { contract, provider, wallet } = getContract(
    "ConfigurationContract",
    configs.contracts.ConfigurationContract
  );
  return await submitSnapshotProposal(
    `Keys: ${configurations.key}: ${configurations.value}`,
    "Creates/Update configuration",
    configs.contracts.ConfigurationContract,
    provider,
    wallet
  ).then(async (res) => {
    const data = res.data;
    const snapshotProposalId = res.uniqueId;
    const daoProposalId = sha3(snapshotProposalId);
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
    if (opts.debug) warn(`DAO Message: ${JSON.stringify(message)}\n`);

    const encodedData = prepareVoteProposalData(message, new Web3(""));
    if (opts.debug) warn(`Encoded DAO message: ${encodedData}\n`);

    const { contract: offchainContract } = getContract(
      "OffchainVotingContract",
      configs.contracts.OffchainVotingContract
    );

    const sender = await offchainContract.getSenderAddress(
      configs.contracts.DaoRegistry,
      configs.contracts.ConfigurationContract,
      encodedData,
      wallet.address,
      { from: wallet.address }
    );

    if (sender !== wallet.address) {
      throw Error(
        `voting.getSenderAddress ${sender} does not match the actual wallet sender: ${wallet.address}`
      );
    }
    const keys = configurations.keys.split(",").map((k) => sha3(k));
    const values = configurations.values.split(",").map((v) => parseInt(v));
    if (process.env.DEBUG) console.log({ keys, values });
    await contract.submitProposal(
      configs.contracts.DaoRegistry,
      daoProposalId,
      [...keys],
      [...values],
      encodedData ? encodedData : ethers.utils.toUtf8Bytes(""),
      { from: wallet.address }
    );
    return { daoProposalId, snapshotProposalId };
  });
};

const processConfigurationProposal = async ({ daoProposalId }) => {
  const { contract, wallet } = getContract(
    "ConfigurationContract",
    configs.contracts.ConfigurationContract
  );

  await isProposalReadyToBeProcessed({ daoProposalId });

  await contract.processProposal(configs.contracts.DaoRegistry, daoProposalId, {
    from: wallet.address,
  });

  return { daoProposalId };
};

module.exports = { submitConfigurationProposal, processConfigurationProposal };
