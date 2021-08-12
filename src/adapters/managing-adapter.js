const Web3 = require("web3");
const { ethers } = require("ethers");
const toBytes32 = ethers.utils.formatBytes32String;
const { sha3 } = require("tribute-contracts/utils/ContractUtil");

const { prepareVoteProposalData } = require("@openlaw/snapshot-js-erc712");

const { entryDao } = require("tribute-contracts/utils/DeploymentUtil");
const { getContract } = require("../utils/contract");
const { submitSnapshotProposal } = require("../utils/snapshot");
const { parseDaoFlags } = require("../core/dao-registry");
const {
  info,
  notice,
  warn,
  success,
  logEnvConfigs,
} = require("../utils/logging");

const submitManagingProposal = async (
  adapterName,
  adapterAddress,
  keys,
  values,
  aclFlags,
  data,
  opts
) => {
  notice(`\n ::: Submitting Managing proposal...\n`);
  logEnvConfigs(opts);
  info(`Adapter:\t\t${adapterName} @ ${adapterAddress}`);
  info(`AccessFlags:\t\t${aclFlags}`);
  info(`Keys:\t\t\t${keys}`);
  info(`Values:\t\t\t${values}`);
  info(`Data:\t\t\t${data ? data : "n/a"}\n`);

  const configKeys = keys.split(",").map((k) => toBytes32(k));
  const configValues = values.split(",").map((v) => v);

  const { contract, provider, wallet } = getContract(
    "ManagingContract",
    opts.network,
    opts.contract
  );

  await submitSnapshotProposal(
    `Adapter: ${adapterName}`,
    "Creates/Update adapter",
    opts.network,
    opts.dao,
    opts.space,
    opts.contract,
    provider,
    wallet
  )
    .then(async (res) => {
      const data = res.data;
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
        sig: res.sig,
        space: data.space,
        timestamp: parseInt(data.timestamp),
      };

      if (opts.debug) warn(`DAO Message: ${JSON.stringify(message)}\n`);
      const encodedData = prepareVoteProposalData(message, new Web3(""));
      if (opts.debug) warn(`Encoded DAO message: ${encodedData}\n`);
      await contract.submitProposal(
        opts.dao,
        sha3(res.uniqueId),
        {
          adapterId: sha3(adapterName),
          adapterAddress: adapterAddress,
          flags: entryDao(
            adapterName,
            { address: adapterAddress },
            parseDaoFlags(aclFlags)
          ).flags,
        },
        configKeys,
        configValues,
        encodedData ? encodedData : ethers.utils.toUtf8Bytes(""),
        { from: wallet.address }
      );
      return sha3(res.uniqueId);
    })
    .then((proposalId) => {
      success(`New DAO Proposal Id: ${proposalId}\n`);
      notice(`::: Managing proposal submitted!\n`);
    });
};

const processManagingProposal = async (proposalId, opts) => {
  notice(`\n::: Processing Managing proposal...\n`);
  logEnvConfigs(opts);
  info(`ProposalId:\t\t${proposalId}`);

  const { contract, wallet } = getContract(
    "ManagingContract",
    opts.network,
    opts.contract
  );

  await contract.processProposal(opts.dao, proposalId, {
    from: wallet.address,
  });
};

module.exports = { submitManagingProposal, processManagingProposal };
