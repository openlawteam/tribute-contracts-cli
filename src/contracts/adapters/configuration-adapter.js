const Web3 = require("web3");
const { ethers } = require("ethers");
const { configs } = require("../../../cli-config");
const { sha3, ZERO_ADDRESS } = require("tribute-contracts/utils/ContractUtil");
const { prepareVoteProposalData } = require("@openlaw/snapshot-js-erc712");
const { getContract } = require("../../utils/contract");
const { warn } = require("../../utils/logging");
const { isProposalReadyToBeProcessed } = require("./offchain-voting-adapter");
const { submitSnapshotProposal } = require("../../services/snapshot-service");
const { getConfigKey } = require("../../utils/dao-configs");

const submitConfigurationProposal = async ({ configurations, opts }) => {
  const { contract, provider, wallet } = getContract(
    "ConfigurationContract",
    configs.contracts.ConfigurationContract
  );
  return await submitSnapshotProposal(
    `Configurations`,
    `Create/Update DAO Configurations`,
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
    await contract.submitProposal(
      configs.contracts.DaoRegistry,
      daoProposalId,
      [...parseConfigs(configurations)],
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

const parseConfigs = (inputs) => {
  if (process.env.DEBUG) console.log(inputs);
  const configurations = [];
  Array.from(inputs).forEach((i) => {
    if (i.configType === "Numeric") {
      configurations.push({
        key: getConfigKey(i.configKey),
        configType: 0, // Numeric
        numericValue: i.configValue,
        addressValue: ZERO_ADDRESS,
      });
    } else if (i.configType === "Address") {
      configurations.push({
        key: getConfigKey(i.configKey),
        configType: 1, // Address
        numericValue: 0,
        addressValue: ethers.utils.getAddress(i.configValue),
      });
    }
  });
  if (process.env.DEBUG) console.log(configurations);
  return configurations;
};

module.exports = {
  submitConfigurationProposal,
  processConfigurationProposal,
  parseConfigs,
};
