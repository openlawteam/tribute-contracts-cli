const Web3 = require("web3");
const { ethers } = require("ethers");
const toBytes32 = ethers.utils.formatBytes32String;
const { sha3 } = require("tribute-contracts/utils/ContractUtil");

const { prepareVoteProposalData } = require("@openlaw/snapshot-js-erc712");

const { entryDao } = require("tribute-contracts/utils/DeploymentUtil");
const { getContract } = require("../utils/contract");
const { submitSnapshotProposal } = require("../utils/snapshot");
const { parseDaoFlags } = require("../core/dao-registry");

const printEnvConfigs = (opts) => {
  console.log(`Network:\t\t${opts.network}`);
  console.log(`DAO:\t\t\t${opts.dao}`);
  console.log(`Space:\t\t\t${opts.space}`);
  console.log(`ManagingContract:\t${opts.contract}`);
};

const submitManagingProposal = async (
  adapterName,
  adapterAddress,
  keys,
  values,
  aclFlags,
  data,
  opts
) => {
  console.log(`\n ::: Submitting Managing proposal...\n`);
  printEnvConfigs(opts);
  console.log(`Adapter:\t\t${adapterName} @ ${adapterAddress}`);
  console.log(`AccessFlags:\t\t${aclFlags}`);
  console.log(`Keys:\t\t\t${keys}`);
  console.log(`Values:\t\t\t${values}`);
  console.log(`Data:\t\t\t${data ? data : "n/a"}\n`);

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
      if (opts.debug)
        console.log(`Snapshot Message: ${JSON.stringify(data)}\n`);
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

      if (opts.debug) console.log(`DAO Message: ${JSON.stringify(message)}\n`);
      const encodedData = prepareVoteProposalData(message, new Web3(""));
      if (opts.debug) console.log(`Encoded DAO message: ${encodedData}\n`);
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
      console.log(`New DAO Proposal Id: ${proposalId}\n`);
      console.log(`::: Managing proposal submitted!\n`);
    });
};

const processManagingProposal = async (proposalId, opts) => {
  console.log(`\n::: Processing Managing proposal...\n`);
  printEnvConfigs(opts);
  console.log(`ProposalId:\t\t${proposalId}`);

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
