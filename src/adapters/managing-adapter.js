const Web3 = require("web3");
const { ethers } = require("ethers");
const toBytes32 = ethers.utils.formatBytes32String;
const { sha3 } = require("tribute-contracts/utils/ContractUtil");

const {
  prepareVoteProposalData,
  prepareProposalMessage,
} = require("@openlaw/snapshot-js-erc712");

const { entryDao } = require("tribute-contracts/utils/DeploymentUtil");
const { getContract } = require("../utils/contract");
const { newProposal } = require("../utils/snapshot");
const { parseDaoFlags } = require("../core/dao-registry");

const newManagingProposal = async (
  adapterName,
  adapterAddress,
  keys,
  values,
  aclFlags,
  data,
  opts
) => {
  console.log(`New managing proposal`);
  console.log(`\tNetwork:\t\t${opts.network}`);
  console.log(`\tDAO:\t\t\t${opts.dao}`);
  console.log(`\tSpace:\t\t\t${opts.space}`);
  console.log(`\tManagingContract:\t${opts.contract}`);
  console.log(`\tAdapter:\t\t${adapterName} @ ${adapterAddress}`);
  console.log(`\tAccessFlags:\t\t${aclFlags}`);
  console.log(`\tKeys:\t\t\t${keys}`);
  console.log(`\tValues:\t\t\t${values}`);
  console.log(`\tData:\t\t\t${data ? data : "n/a"}`);

  const configKeys = keys.split(",").map((k) => toBytes32(k));
  const configValues = values.split(",").map((v) => v);

  const { contract, provider, wallet } = getContract(
    "ManagingContract",
    opts.network,
    opts.contract
  );

  await newProposal(
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
      console.log(res.data);
      const data = res.data;
      const message = {
        timestamp: data.timestamp,
        space: data.space,
        submitter: wallet.address,
        payload: {
          name: data.payload.name,
          body: data.payload.body,
          //metadata: data.payload.metadata,
          choices: data.payload.choices,
          snapshot: data.payload.snapshot,
          start: data.payload.start,
          end: data.payload.end,
        },
        sig: res.erc712Message.sig,
      };
      console.log(message);
      const encodedData = prepareProposalMessage(message, new Web3(""));
      console.log(encodedData);
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
        encodedData ? encodedData : [],
        { from: wallet.address, gasPrice: "0x1" }
      );
      return sha3(res.uniqueId);
    })
    .then((proposalId) => console.log(`New DAO proposal: ${proposalId}`));
};

module.exports = { newManagingProposal };
