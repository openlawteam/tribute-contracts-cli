import {
  buildProposalMessage,
  buildVoteMessage,
  prepareProposalMessage,
  prepareVoteMessage,
  submitMessage,
  getSpace,
  getVotes,
  getProposals,
  SnapshotType,
} from "@openlaw/snapshot-js-erc712";

import { configs } from "../../cli-config.js";
import { error } from "../utils/logging.js";
import { getDAOConfig } from "../contracts/core/dao-registry.js";
import { SignerV4 } from "../utils/signer.js";

const ContractDAOConfigKeys = {
  offchainVotingGracePeriod: "offchainvoting.gracePeriod",
  offchainVotingStakingAmount: "offchainvoting.stakingAmount",
  offchainVotingVotingPeriod: "offchainvoting.votingPeriod",
  onboardingChunkSize: "onboarding.chunkSize",
  onboardingMaximumChunks: "onboarding.maximumChunks",
  onboardingUnitsPerChunk: "onboarding.unitsPerChunk",
  onboardingTokenAddr: "onboarding.tokenAddr",
  votingGracePeriod: "voting.gracePeriod",
  votingStakingAmount: "voting.stakingAmount",
  votingVotingPeriod: "voting.votingPeriod",
};

export const submitSnapshotProposal = ({
  title,
  description,
  actionId,
  provider,
  wallet,
}) => {
  return signAndSendProposal({
    proposal: {
      partialProposalData: {
        name: title,
        body: description,
        metadata: {
          type: "Governance",
        },
      },
      type: SnapshotType.proposal,
      space: configs.space,
      actionId,
      network: configs.network,
      dao: configs.dao,
    },
    provider,
    wallet,
  }).catch((err) => {
    const resp = err.response;
    if (resp && resp.data && resp.data.error_description) {
      error(`Error: ${resp.data.error_description}`);
    }
    throw err;
  });
};

export const submitSnapshotVote = ({
  snapshotProposalId,
  daoProposalId,
  choice,
  network,
  dao,
  space,
  actionId,
  provider,
  wallet,
}) => {
  return signAndSendVote({
    vote: {
      partialVoteData: {
        choice: choice,
        daoProposalId,
        snapshotProposalId,
      },
      type: SnapshotType.vote,
      space,
      actionId,
      network,
      dao,
    },
    provider,
    wallet,
  }).catch((err) => {
    const resp = err.response;
    if (resp && resp.data && resp.data.error_description) {
      error(`Error: ${resp.data.error_description}`, err);
    }
    throw err;
  });
};

export const getSnapshotProposal = ({ snapshotProposalId, space }) => {
  return getProposals(configs.snapshotHubApi, space, snapshotProposalId)
    .then((res) => {
      const proposals = res.data;
      if (proposals && proposals[snapshotProposalId]) {
        return proposals[snapshotProposalId];
      }
      throw Error("Proposal not found in Snapshot Hub");
    })
    .catch((err) => {
      const resp = err.response;
      if (resp && resp.data && resp.data.error_description) {
        error(`Error: ${resp.data.error_description}`, err);
      }
      throw err;
    });
};

export const getSnapshotVotes = ({ snapshotProposalId, space }) => {
  return getVotes(configs.snapshotHubApi, space, snapshotProposalId).catch(
    (err) => {
      const resp = err.response;
      if (resp && resp.data && resp.data.error_description) {
        error(`Error: ${resp.data.error_description}`, err);
      }
      throw err;
    }
  );
};

const buildProposalMessageHelper = async ({
  commonData,
  network,
  daoRegistry,
  provider,
}) => {
  const snapshot = await provider.getBlockNumber();

  const votingTimeSeconds = parseInt(
    await getDAOConfig(
      ContractDAOConfigKeys.offchainVotingVotingPeriod,
      daoRegistry,
      network
    )
  );

  return await buildProposalMessage(
    {
      ...commonData,
      votingTimeSeconds,
      snapshot,
    },
    configs.snapshotHubApi
  );
};

const signAndSendProposal = async ({ proposal, provider, wallet }) => {
  const { partialProposalData, actionId, space, dao, network } = proposal;

  // When using ganache, the getNetwork call always returns UNKNOWN, so we ignore that.
  const { chainId } = await provider.getNetwork();

  const { body, name, metadata, timestamp } = partialProposalData;

  const { data } = await getSpace(configs.snapshotHubApi, space);

  // 1. Check proposal type and prepare appropriate message
  const message = await buildProposalMessageHelper({
    commonData: {
      name,
      body,
      metadata,
      token: data.token,
      space,
      timestamp,
    },
    network,
    daoRegistry: dao,
    provider,
  });

  // 2. Sign data
  const signature = SignerV4(wallet.privateKey)(
    message,
    configs.dao,
    actionId,
    chainId
  );

  // 3. Send data to snapshot-hub
  const resp = await submitMessage(
    process.env.SNAPSHOT_HUB_API_URL,
    wallet.address,
    message,
    signature,
    {
      actionId: actionId,
      chainId: chainId,
      verifyingContract: configs.dao,
      message: prepareProposalMessage(message),
    }
  );

  return {
    data: message,
    sig: signature,
    uniqueId: resp.data.uniqueId,
    uniqueIdDraft: resp.data.uniqueIdDraft || "",
  };
};

const signAndSendVote = async ({ vote, provider, wallet }) => {
  const { partialVoteData, type, space, actionId } = vote;

  const { chainId } = await provider.getNetwork();

  const { daoProposalId, snapshotProposalId, choice } = partialVoteData;

  const { data } = await getSpace(configs.snapshotHubApi, space);

  const voteData = {
    chainId: chainId,
    choice,
    metadata: {
      // Must be the true member's address for calculating voting power.
      memberAddress: wallet.address,
    },
  };

  const voteProposalData = {
    proposalId: daoProposalId,
    space: space,
    token: data.token,
  };

  // 1. Prepare snapshot vote message
  const message = await buildVoteMessage(
    voteData,
    voteProposalData,
    configs.snapshotHubApi
  );

  // 2. Sign data
  const signature = SignerV4(wallet.privateKey)(
    { ...message, type },
    configs.dao,
    actionId,
    chainId
  );

  // 3. Send data to snapshot-hub
  const resp = await submitMessage(
    configs.snapshotHubApi,
    wallet.address,
    {
      ...message,
      payload: { ...message.payload, proposalId: snapshotProposalId },
    },
    signature,
    {
      actionId: actionId,
      chainId: chainId,
      verifyingContract: configs.dao,
      message: prepareVoteMessage(message),
    }
  );

  return {
    data: message,
    sig: signature,
    uniqueId: resp.data.uniqueId,
  };
};
