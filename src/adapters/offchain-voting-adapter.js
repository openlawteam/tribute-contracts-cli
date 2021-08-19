const { configs } = require("../../cli-config");
const { sha3, UNITS } = require("tribute-contracts/utils/ContractUtil");
const {
  VoteChoicesIndex,
  prepareVoteResult,
  getVoteResultRootDomainDefinition,
  createVote,
  getOffchainVotingProof,
  submitOffchainVotingProof,
} = require("@openlaw/snapshot-js-erc712");
const { getContract } = require("../utils/contract");
const {
  submitSnapshotVote,
  getSnapshotVotes,
  getSnapshotProposal,
} = require("../utils/snapshot");
const {
  info,
  notice,
  warn,
  success,
  logEnvConfigs,
  error,
} = require("../utils/logging");
const { getBalanceOf } = require("../extensions/bank-extension");
const { getAddressIfDelegated } = require("../core/dao-registry");
const { normalize } = require("eth-sig-util");
const { SignerV4 } = require("../utils/signer");

const newOffchainVote = async (snapshotProposalId, choice, data, opts) => {
  const daoProposalId = sha3(snapshotProposalId);

  notice(`\n ::: Submitting offchain voting...\n`);
  logEnvConfigs(configs, configs.contracts.OffchainVoting);

  info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
  info(`DAO Proposal Id:\t${daoProposalId}`);
  info(`Choice:\t\t\t${choice}`);
  info(`Data:\t\t\t${data ? data : "n/a"}\n`);

  const { provider, wallet } = getContract(
    "OffchainVotingContract",
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
    notice(`New Snapshot Vote Id: ${res.uniqueId}\n`);
    notice(`Member ${wallet.address} has voted "${choice}"\n`);
    notice(`Snapshot Proposal Id ${snapshotProposalId}\n`);
  });
};

const submitOffchainResult = async (snapshotProposalId) => {
  const daoProposalId = sha3(snapshotProposalId);

  notice(`\n ::: Submitting offchain voting results...\n`);
  logEnvConfigs(configs, configs.contracts.OffchainVotingContract);

  info(`Snapshot Proposal Id:\t${snapshotProposalId}`);
  info(`DAO Proposal Id:\t${daoProposalId}`);

  const snapshotProposal = await getSnapshotProposal(
    snapshotProposalId,
    configs.space
  );
  if (configs.debug)
    warn(`\n Snapshot Proposal: ${JSON.stringify(snapshotProposal)}`);

  const res = await getSnapshotVotes(snapshotProposalId, configs.space);

  const snapshotVotes = res.data;

  if (snapshotVotes && snapshotVotes.length === 0)
    throw Error("No votes found");

  const {
    contract: bankExtension,
    provider,
    wallet,
  } = getContract("BankExtension", configs.contracts.BankExtension);

  const { contract: offchainContract } = getContract(
    "OffchainVotingContract",
    configs.contracts.OffchainVotingContract
  );

  const snapshot = snapshotProposal.msg.payload.snapshot.toString();

  const votes = await Promise.all(
    snapshotVotes
      .map((v) => v[Object.keys(v)[0]])
      .map(async (vote) => {
        // Must be the true member's address for calculating voting power.
        const memberBalanceAtSnapshot = await bankExtension.getPriorAmount(
          normalize(vote.msg.payload.metadata.memberAddress),
          UNITS,
          snapshot
        );

        return createVote({
          proposalId: daoProposalId,
          sig: vote.sig || "0x",
          timestamp: vote ? Number(vote.msg.timestamp) : 0,
          voteYes: vote.msg.payload.choice === VoteChoicesIndex.Yes,
          weight: vote ? memberBalanceAtSnapshot : "0",
        });
      })
  );

  if (configs.debug) warn(`\nVotes: ${JSON.stringify(votes)}`);

  const { chainId } = await provider.getNetwork();

  // Prepare vote Result
  const { voteResultTree, result } = await prepareVoteResult({
    actionId: offchainContract.address,
    chainId: chainId,
    daoAddress: configs.contracts.DaoRegistry,
    votes,
  });

  // The last of the result node tree steps
  const resultNodeLast = result[result.length - 1];

  // Validate the vote result node by calling the contract
  // const getBadNodeErrorResponse = await offchainContract.getBadNodeError(
  //   configs.contracts.DaoRegistry,
  //   daoProposalId,
  //   // `bool submitNewVote`
  //   true,
  //   voteResultTree.getHexRoot(),
  //   snapshot,
  //   // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
  //   0,
  //   resultNodeLast
  // );

  // if (Number(getBadNodeErrorResponse) !== 0) {
  //   throw new Error(
  //     `Cannot submit off-chain voting result. Node has an error: ${getBadNodeErrorResponse}.`
  //   );
  // }

  // Sign root hex result message
  const signature = SignerV4(wallet.privateKey)(
    { root: voteResultTree.getHexRoot(), type: "result" },
    configs.contracts.DaoRegistry,
    offchainContract.address,
    chainId
  );

  // Check if off-chain proof has already been submitted
  const snapshotOffchainProofExists =
    ((
      await getOffchainVotingProof(
        configs.snapshotHubApi,
        configs.space,
        voteResultTree.getHexRoot()
      )
    )?.merkle_root.length || "") > 0;

  /**
   * Send off-chain vote proof silently to Snapshot Hub for storage and later use.
   *
   * We're piggy-backing off of the signature async call's status, instead of setting another status.
   * E.g. It may confuse the user if we were to display text saying we're "submitting
   * off-chain proof", or something to this effect, for a second or two.
   */
  if (!snapshotOffchainProofExists) {
    await submitOffchainVotingProof(configs.snapshotHubApi, configs.space, {
      actionId: offchainContract.address,
      chainId: chainId,
      steps: result,
      merkleRoot: voteResultTree.getHexRoot(),
      verifyingContract: configs.contracts.DaoRegistry,
    });
    info("\nOffchain proof submitted to Snapshot Hub");
  }

  const a = await getAddressIfDelegated(wallet.address);
  error(a);
  const b = await getBalanceOf(wallet.address, UNITS);
  error(b);

  // Send the tx
  offchainContract.on("Debug", (event) => {

    console.log(event);
  });
  const receipt = await offchainContract.submitVoteResult(
    configs.contracts.DaoRegistry,
    daoProposalId,
    voteResultTree.getHexRoot(),
    resultNodeLast,
    signature,
    { from: wallet.address }
  );

  notice(`::: Vote results submitted for DAO Proposal Id ${daoProposalId}!\n`);
};

module.exports = { newOffchainVote, submitOffchainResult };
