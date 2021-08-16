const Web3 = require("web3");
const { ethers } = require("ethers");
const { configs } = require("../../cli-config");

const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { prepareVoteProposalData } = require("@openlaw/snapshot-js-erc712");
const { getContract } = require("../utils/contract");
const { submitSnapshotVote } = require("../utils/snapshot");
const {
  info,
  notice,
  warn,
  success,
  logEnvConfigs,
  error,
} = require("../utils/logging");

const voteOnProposal = async (snapshotProposalId, choice, data, opts) => {
  const daoProposalId = sha3(snapshotProposalId);

  notice(`\n ::: Submitting offchain voting...\n`);
  logEnvConfigs(configs, configs.contracts.OffchainVoting);

  info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
  info(`DAO Proposal Id:\t${daoProposalId}`);
  info(`Choice:\t\t\t${choice}`);
  info(`Data:\t\t\t${data ? data : "n/a"}\n`);

  const { provider, wallet } = getContract(
    "OffchainVotingContract",
    configs.network,
    configs.contracts.OffchainVotingContract
  );

  await submitSnapshotVote(
    snapshotProposalId,
    daoProposalId,
    choice,
    configs.network,
    configs.contracts.DaoRegistry,
    configs.space,
    configs.contracts.OffchainVotingContract,
    provider,
    wallet
  ).then(async (res) => {
    notice(`::: Voted ${choice} on DAO Proposal Id ${daoProposalId}!\n`);
  });
};

module.exports = { voteOnProposal };
