const Web3 = require("web3");
const { ethers } = require("ethers");
const { configs } = require("../../../cli-config");
const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { prepareVoteProposalData } = require("@openlaw/snapshot-js-erc712");
const { getContract } = require("../../utils/contract");
const { submitSnapshotProposal } = require("../../services/snapshot-service");
const { warn } = require("../../utils/logging");

const submitConfigurationProposal = async (key, value, opts) => {
  const { contract, provider, wallet } = getContract(
    "ConfigurationContract",
    configs.contracts.ConfigurationContract
  );
  return await submitSnapshotProposal(
    `Key: ${key} -> ${value}`,
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

    await contract.submitProposal(
      configs.contracts.DaoRegistry,
      daoProposalId,
      [sha3(key)],
      [Number(value)],
      encodedData ? encodedData : ethers.utils.toUtf8Bytes(""),
      { from: wallet.address }
    );
    return { daoProposalId, snapshotProposalId };
  });
};

const processConfigurationProposal = async (daoProposalId) => {
  const { contract, wallet } = getContract(
    "ConfigurationContract",
    configs.contracts.ConfigurationContract
  );

  await contract.processProposal(configs.contracts.DaoRegistry, daoProposalId, {
    from: wallet.address,
  });

  return { daoProposalId };
};

module.exports = { submitConfigurationProposal, processConfigurationProposal };
