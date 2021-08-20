const {
  buildProposalMessage,
  getSpace,
  prepareProposalMessage,
  prepareVoteMessage,
  submitMessage,
  buildVoteMessage,
  SnapshotType,
  getVotes,
  getProposals,
} = require("@openlaw/snapshot-js-erc712");
const { configs } = require("../../cli-config");
const { notice, error, success } = require("./logging");
const { getDAOConfig } = require("../core/dao-registry");
const { SignerV4 } = require("../utils/signer");
const { normalize } = require("eth-sig-util");

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

const buildProposalMessageHelper = async (
  commonData,
  network,
  daoRegistry,
  provider
) => {
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

const signAndSendProposal = async (proposal, provider, wallet) => {
  const { partialProposalData, adapterAddress, type, space, dao, network } =
    proposal;

  // When using ganache, the getNetwork call always returns UNKNOWN, so we ignore that.
  const { chainId } = await provider.getNetwork();

  const actionId = adapterAddress;

  const { body, name, metadata, timestamp } = partialProposalData;

  const { data } = await getSpace(configs.snapshotHubApi, space);

  const commonData = {
    name,
    body,
    metadata,
    token: data.token,
    space,
  };

  // 1. Check proposal type and prepare appropriate message
  const message = await buildProposalMessageHelper(
    {
      ...commonData,
      timestamp,
    },
    network,
    dao,
    provider
  );

  // 2. Sign data
  const signature = SignerV4(wallet.privateKey)(
    message,
    configs.contracts.DaoRegistry,
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
      verifyingContract: configs.contracts.DaoRegistry,
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

const signAndSendVote = async (vote, provider, wallet) => {
  const { partialVoteData, type, space, actionId } = vote;

  // When using ganache, the getNetwork call always returns UNKNOWN, so we ignore that.
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
    configs.contracts.DaoRegistry,
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
      verifyingContract: configs.contracts.DaoRegistry,
      message: prepareVoteMessage(message),
    }
  );

  return {
    data: message,
    sig: signature,
    uniqueId: resp.data.uniqueId,
  };
};

const submitSnapshotProposal = (
  title,
  description,
  adapter,
  provider,
  wallet
) => {
  return signAndSendProposal(
    {
      partialProposalData: {
        name: title,
        body: description,
        metadata: {
          type: "Governance",
        },
      },
      type: SnapshotType.proposal,
      space: configs.space,
      adapterAddress: adapter,
      network: configs.network,
      dao: configs.contracts.DaoRegistry,
    },
    provider,
    wallet
  ).catch((err) => {
    const resp = err.response;
    if (resp && resp.data && resp.data.error_description) {
      error(`Error: ${resp.data.error_description}`);
    }
    throw err;
  });
};

const submitSnapshotVote = (
  snapshotProposalId,
  daoProposalId,
  choice,
  network,
  dao,
  space,
  actionId,
  provider,
  wallet
) => {
  return signAndSendVote(
    {
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
    wallet
  ).catch((err) => {
    const resp = err.response;
    if (resp && resp.data && resp.data.error_description) {
      error(`Error: ${resp.data.error_description}`, err);
    }
    throw err;
  });
};

const getSnapshotProposal = (snapshotProposalId, space) => {
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

const getSnapshotVotes = (snapshotProposalId, space) => {
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

module.exports = {
  submitSnapshotProposal,
  submitSnapshotVote,
  getSnapshotProposal,
  getSnapshotVotes,
};
