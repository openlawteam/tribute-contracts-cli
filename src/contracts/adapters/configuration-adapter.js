const Web3 = require("web3");
const { ethers } = require("ethers");
const { configs } = require("../../../cli-config");
const { sha3, toBN } = require("tribute-contracts/utils/ContractUtil");
const { prepareVoteProposalData } = require("@openlaw/snapshot-js-erc712");
const { getContract } = require("../../utils/contract");
const { submitSnapshotProposal } = require("../../services/snapshot-service");
const { warn } = require("../../utils/logging");
const { getAdapterAddress } = require("../core/dao-registry");

const submitConfigurationProposal = async (key, value, opts) => {
  const configurationContractAddress = await getAdapterAddress("configuration");

  const { contract, provider, wallet } = getContract(
    "ConfigurationContract",
    configurationContractAddress
  );

  return await submitSnapshotProposal(
    `Key: ${key} -> ${value}`,
    "Creates/Update configuration",
    configurationContractAddress,
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
      submitter: wallet.address,
      sig: res.sig,
      space: data.space,
      timestamp: parseInt(data.timestamp),
    };
    if (opts.debug) warn(`DAO Message: ${JSON.stringify(message)}\n`);

    const encodedData = prepareVoteProposalData(message, new Web3(""));
    if (opts.debug) warn(`Encoded DAO message: ${encodedData}\n`);

    await contract.submitProposal(
      configs.dao,
      daoProposalId,
      [sha3(key)],
      [value],
      encodedData ? encodedData : ethers.utils.toUtf8Bytes(""),
      { from: wallet.address }
    );
    return { daoProposalId, snapshotProposalId };
  });
};

const processConfigurationProposal = async (daoProposalId) => {
  const configurationContractAddress = await getAdapterAddress("configuration");

  const { contract, wallet } = getContract(
    "ConfigurationContract",
    configurationContractAddress
  );

  await contract.processProposal(configs.dao, daoProposalId, {
    from: wallet.address,
  });

  return { daoProposalId };
};

module.exports = { processConfigurationProposal, submitConfigurationProposal };
