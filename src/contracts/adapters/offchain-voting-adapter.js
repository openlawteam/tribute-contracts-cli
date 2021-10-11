const { configs } = require("../../../cli-config");
const {
  UNITS,
  TOTAL,
  MEMBER_COUNT,
} = require("tribute-contracts/utils/ContractUtil");
const {
  VoteChoicesIndex,
  prepareVoteResult,
  createVote,
  getOffchainVotingProof,
  submitOffchainVotingProof,
} = require("@openlaw/snapshot-js-erc712");
const { getContract } = require("../../utils/contract");
const { normalizeString } = require("../../utils/string");
const { numberRangeArray } = require("../../utils/array");
const {
  submitSnapshotVote,
  getSnapshotVotes,
  getSnapshotProposal,
} = require("../../services/snapshot-service");
const { warn } = require("../../utils/logging");
const { getPriorAmount } = require("../extensions/bank-extension");
const { SignerV4 } = require("../../utils/signer");
const { getMemberAddress, getAdapterAddress } = require("../core/dao-registry");

const BadNodeError = {
  0: "OK",
  1: "WRONG_PROPOSAL_ID",
  2: "INVALID_CHOICE",
  3: "AFTER_VOTING_PERIOD",
  4: "BAD_SIGNATURE",
};

const newOffchainVote = async (snapshotProposalId, daoProposalId, choice) => {
  const offchainContractAddress = await getAdapterAddress("voting");
  const { provider, wallet } = getContract(
    "OffchainVotingContract",
    offchainContractAddress
  );

  const snapshotProposal = await getSnapshotProposal(
    snapshotProposalId,
    configs.space
  );

  return submitSnapshotVote(
    snapshotProposalId,
    daoProposalId,
    choice,
    configs.network,
    configs.dao,
    configs.space,
    snapshotProposal.actionId,
    provider,
    wallet
  ).then(() => {
    return { snapshotProposalId, choice, memberAddress: wallet.address };
  });
};

const submitOffchainResult = async (snapshotProposalId, daoProposalId) => {
  const snapshotProposal = await getSnapshotProposal(
    snapshotProposalId,
    configs.space
  );

  const actionId = snapshotProposal.actionId;
  const snapshot = snapshotProposal.msg.payload.snapshot.toString();

  if (configs.debug)
    warn(`\n Snapshot Proposal: ${JSON.stringify(snapshotProposal)}`);

  const res = await getSnapshotVotes(snapshotProposalId, configs.space);
  const snapshotVotes = res.data;
  if (snapshotVotes && snapshotVotes.length === 0)
    throw Error("No votes found");

  const numberOfDAOMembersAtSnapshot = await getPriorAmount(
    TOTAL,
    MEMBER_COUNT,
    snapshot
  );
  const memberAddresses = await Promise.all(
    numberRangeArray(Number(numberOfDAOMembersAtSnapshot) - 1, 0).map(
      (memberIndex) => getMemberAddress(memberIndex)
    )
  );

  const voteEntries = await Promise.all(
    memberAddresses.map(async (memberAddress, i) => {
      const voteData = Object.values(
        snapshotVotes.find(
          (v) =>
            normalizeString(memberAddress) ===
            normalizeString(
              Object.values(v)[0].msg.payload.metadata.memberAddress
            )
        ) || {}
      )[0];

      // Get the member's balance at the snapshot
      const memberBalanceAtSnapshot = await getPriorAmount(
        memberAddress,
        UNITS,
        snapshot
      );

      // Create votes based on whether `voteData` was found for `memberAddress`
      return createVote({
        proposalId: daoProposalId,
        sig: voteData?.sig || "0x",
        timestamp: voteData ? Number(voteData.msg.timestamp) : 0,
        voteYes: voteData?.msg.payload.choice === VoteChoicesIndex.Yes,
        weight: voteData ? memberBalanceAtSnapshot : "0",
      });
    })
  );

  if (configs.debug) warn(`\nVotes: ${JSON.stringify(voteEntries)}`);
  const offchainContractAddress = await getAdapterAddress("voting");

  const {
    contract: offchainContract,
    provider,
    wallet,
  } = getContract("OffchainVotingContract", offchainContractAddress);

  const { chainId } = await provider.getNetwork();

  // Prepare vote Result
  const { voteResultTree, result } = await prepareVoteResult({
    actionId: actionId,
    chainId: chainId,
    daoAddress: configs.dao,
    votes: voteEntries,
  });

  // The last of the result node tree steps
  const resultNodeLast = result[result.length - 1];

  // Validate the vote result node by calling the contract
  const getBadNodeErrorResponse = await offchainContract.getBadNodeError(
    configs.dao,
    daoProposalId,
    true, // `submitNewVote`
    voteResultTree.getHexRoot(), // resultRoot
    snapshot, // blockNumber
    0, // gracePeriodStartingTime  should be `0` as `submitNewVote` is `true`
    numberOfDAOMembersAtSnapshot, // nbMembers
    resultNodeLast // VoteResultNode
  );

  if (getBadNodeErrorResponse !== 0 /*OK*/) {
    throw new Error(
      `Cannot submit off-chain voting result. Node has an error: ${BadNodeError[getBadNodeErrorResponse]}.`
    );
  }

  // Sign root hex result message
  const signature = SignerV4(wallet.privateKey)(
    { root: voteResultTree.getHexRoot(), type: "result" },
    configs.dao,
    actionId,
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
      actionId: actionId,
      chainId: chainId,
      steps: result,
      merkleRoot: voteResultTree.getHexRoot(),
      verifyingContract: configs.dao,
    });
    if (configs.debug) warn("\nOffchain proof submitted to Snapshot Hub");
  }

  // Send the tx
  const reporter = wallet.address;
  await offchainContract.submitVoteResult(
    configs.dao,
    daoProposalId,
    voteResultTree.getHexRoot(),
    reporter,
    resultNodeLast,
    signature,
    { from: reporter }
  );

  return {
    daoProposalId,
    snapshotProposalId,
    signature,
    voteResultHexRoot: voteResultTree.getHexRoot(),
  };
};

module.exports = { newOffchainVote, submitOffchainResult };
