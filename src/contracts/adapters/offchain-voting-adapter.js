import {
  UNITS,
  TOTAL,
  MEMBER_COUNT,
} from "tribute-contracts/utils/contract-util.js";
import { adaptersIdsMap } from "tribute-contracts/utils/dao-ids-util.js";
import {
  VoteChoicesIndex,
  prepareVoteResult,
  createVote,
  getOffchainVotingProof,
  submitOffchainVotingProof,
} from "@openlaw/snapshot-js-erc712";

import { getAdapter } from "../../utils/contract.js";
import { normalizeString } from "../../utils/string.js";
import { numberRangeArray } from "../../utils/array.js";
import { configs } from "../../../cli-config.js";
import {
  submitSnapshotVote,
  getSnapshotVotes,
  getSnapshotProposal,
} from "../../services/snapshot-service.js";
import { warn } from "../../utils/logging.js";
import { getPriorAmount } from "../extensions/bank-extension.js";
import { SignerV4 } from "../../utils/signer.js";
import { getMemberAddress, getAdapter } from "../core/dao-registry.js";

const CONTRACT_NAME = "OffchainVotingContract";

export const BadNodeError = {
  0: "OK",
  1: "WRONG_PROPOSAL_ID",
  2: "INVALID_CHOICE",
  3: "AFTER_VOTING_PERIOD",
  4: "BAD_SIGNATURE",
  5: "INDEX_OUT_OF_BOUND",
  6: "VOTE_NOT_ALLOWED",
};

const VotingState = {
  0: "NOT_STARTED",
  1: "TIE",
  2: "PASS",
  3: "NOT_PASS",
  4: "IN_PROGRESS",
  5: "GRACE_PERIOD",
};

export const newOffchainVote = async ({
  snapshotProposalId,
  daoProposalId,
  choice,
}) => {
  const { provider, wallet } = await getAdapter(
    adaptersIdsMap.VOTING_ADAPTER,
    CONTRACT_NAME
  );

  const snapshotProposal = await getSnapshotProposal({
    snapshotProposalId,
    space: configs.space,
  });

  return submitSnapshotVote({
    snapshotProposalId,
    daoProposalId,
    choice,
    network: configs.network,
    dao: configs.dao,
    space: configs.space,
    actionId: snapshotProposal.actionId,
    provider,
    wallet,
  }).then(() => {
    return { snapshotProposalId, choice, memberAddress: wallet.address };
  });
};

export const submitOffchainResult = async ({
  snapshotProposalId,
  daoProposalId,
}) => {
  const snapshotProposal = await getSnapshotProposal({
    snapshotProposalId,
    space: configs.space,
  });

  const actionId = snapshotProposal.actionId;
  const snapshot = snapshotProposal.msg.payload.snapshot.toString();

  if (configs.debug)
    warn(`\n Snapshot Proposal: ${JSON.stringify(snapshotProposal)}`);

  const res = await getSnapshotVotes({
    snapshotProposalId,
    space: configs.space,
  });
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

  const {
    contract: offchainVotingAdapter,
    provider,
    wallet,
  } = await getAdapter(adaptersIdsMap.VOTING_ADAPTER, CONTRACT_NAME);

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
  const getBadNodeErrorResponse = await offchainVotingAdapter.getBadNodeError(
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
  await offchainVotingAdapter.submitVoteResult(
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

export const checkSenderAddress = async ({
  adapterAddress,
  encodedData,
  sender,
}) => {
  const { contract: offchainVotingAdapter } = await getAdapter(
    adaptersIdsMap.VOTING_ADAPTER,
    CONTRACT_NAME
  );

  const retrievedSender = await offchainVotingAdapter.getSenderAddress(
    configs.dao,
    adapterAddress,
    encodedData,
    sender,
    { from: sender }
  );

  if (sender !== retrievedSender) {
    throw Error(
      `voting.getSenderAddress ${retrievedSender} does not match the actual wallet sender: ${sender}`
    );
  }
};

export const getVoteStatus = async ({ daoProposalId }) => {
  const { contract: offchainVotingAdapter, wallet } = await getAdapter(
    adaptersIdsMap.VOTING_ADAPTER,
    CONTRACT_NAME
  );

  const votingStatusId = await offchainVotingAdapter.voteResult(
    configs.dao,
    daoProposalId,
    { from: wallet.address }
  );
  if (configs.debug) warn(`\nVote status id: ${votingStatusId}`);
  return VotingState[votingStatusId];
};

export const isProposalReadyToBeProcessed = async ({ daoProposalId }) => {
  const { contract: offchainVotingAdapter, wallet } = await getAdapter(
    adaptersIdsMap.VOTING_ADAPTER,
    CONTRACT_NAME
  );

  const votingStateId = await offchainVotingAdapter.voteResult(
    configs.dao,
    daoProposalId,
    { from: wallet.address }
  );
  if (configs.debug) warn(`\nVote state id: ${votingStateId}`);
  switch (votingStateId) {
    case 2: //"PASS"
      return Promise.resolve(true);
    case 0: //"NOT_STARTED",
    case 1: //"TIE",
    case 3: //"NOT_PASS",
    case 4: //"IN_PROGRESS",
    case 5: //"GRACE_PERIOD",
    default:
      return Promise.reject(
        `Proposal not ready to be processed, state: ${VotingState[votingStateId]}`
      );
  }
};
