const Web3 = require("web3");
const { ethers } = require("ethers");
const { configs } = require("../../cli-config");

const { sha3, UNITS } = require("tribute-contracts/utils/ContractUtil");
const {
  prepareVoteProposalData,
  VoteChoices,
  VoteChoicesIndex,
  prepareVoteResult,
  getVoteResultRootDomainDefinition,
  signMessage,
  createVote,
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

const getUnitsPerChoiceFromContract = (
  bankAddress,
  getPriorAmountABI,
  snapshot,
  voterAddressesAndChoices,
  provider
) => {
  // Create results object to set later
  const results = {
    [VoteChoices.Yes]: {
      percentage: 0,
      units: 0,
    },
    [VoteChoices.No]: {
      percentage: 0,
      units: 0,
    },
    totalUnits: 0,
  };

  // Build a call for total units
  const totalUnitsCall = [
    bankAddress,
    getPriorAmountABI,
    [
      TOTAL_ADDRESS, // account
      UNITS_ADDRESS, // tokenAddr
      snapshot.toString(), // blockNumber
    ],
  ];

  // Build calls to Bank contract
  const unitsCalls = voterAddressesAndChoices.map(([address]) => [
    bankAddress,
    getPriorAmountABI,
    [
      address, // account
      UNITS_ADDRESS, // tokenAddr
      snapshot.toString(), // blockNumber
    ],
  ]);

  // const calls = [totalUnitsCall, ...unitsCalls];

  // const [totalUnitsResult, ...votingResults] = await multicall({
  //   calls,
  //   web3Instance,
  // });

  // // Set Units values for choices
  // votingResults.forEach((units, i) => {
  //   const isYes =
  //     VoteChoicesIndex[voterAddressesAndChoices[i][1]] ===
  //     VoteChoicesIndex[VoteChoicesIndex.Yes];
  //   const choice = isYes ? VoteChoices.Yes : VoteChoices.No;

  //   results[choice].units += Number(units);
  // });

  // // Set percentages
  // results[VoteChoices.Yes].percentage =
  //   (results[VoteChoices.Yes].units / Number(totalUnitsResult)) * 100;

  // results[VoteChoices.No].percentage =
  //   (results[VoteChoices.No].units / Number(totalUnitsResult)) * 100;

  // // Set total units
  // results.totalUnits = Number(totalUnitsResult);

  // return results;
};

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
    notice(`New Snapshot Vote Id: ${res.uniqueId}\n`);
    notice(
      `::: Voted "${choice}" on Snapshot Proposal Id: ${snapshotProposalId}\n`
    );
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
  console.log(`\n Snapshot Proposal: ${JSON.stringify(snapshotProposal)}`);

  const res = await getSnapshotVotes(snapshotProposalId, configs.space);

  const snapshotVotes = res.data;

  if (snapshotVotes && snapshotVotes.length === 0)
    throw Error("No votes found");

  const {
    contract: bankExtension,
    provider,
    wallet,
  } = getContract(
    "BankExtension",
    configs.network,
    configs.contracts.BankExtension
  );

  const { contract: offchainContract } = getContract(
    "OffchainVotingContract",
    configs.network,
    configs.contracts.OffchainVotingContract
  );

  const snapshot = snapshotProposal.msg.payload.snapshot.toString();

  const daoVotes = await snapshotVotes.map(async (v) => {
    const vote = v[Object.keys(v)[0]];

    /**
     * Must be the true member's address for calculating voting power.
     * This value is (or at least should be) derived from `OffchainVoting.memberAddressesByDelegatedKey`.
     */
    const memberBalanceAtSnapshot = await bankExtension.getPriorAmount(
      vote.msg.payload.metadata.memberAddress,
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
  });

  console.log(`\nVotes: ${JSON.stringify(daoVotes)}`);

  const { chainId } = await provider.getNetwork();

  // Prepare vote Result
  const { voteResultTree, result } = await prepareVoteResult({
    actionId: offchainContract.address,
    chainId: chainId,
    daoAddress: configs.contracts.DaoRegistry,
    daoVotes,
  });

  const voteResultTreeHexRoot = voteResultTree.getHexRoot();
  // The last of the result node tree steps
  const resultNodeLast = result[result.length - 1];

  // Validate the vote result node by calling the contract
  // const getBadNodeErrorResponse = await offchainContract
  //   .getBadNodeError(
  //     configs.contracts.DaoRegistry,
  //     daoProposalId,
  //     // `bool submitNewVote`
  //     true,
  //     voteResultTreeHexRoot,
  //     snapshot,
  //     // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
  //     0,
  //     resultNodeLast
  //   )
  //   .call();

  // if (Number(getBadNodeErrorResponse) !== BadNodeError.OK) {
  //   throw new Error(
  //     `Cannot submit off-chain voting result. Node has an error: ${BadNodeError[getBadNodeErrorResponse]}.`
  //   );
  // }

  // Prepare to sign root hex result
  const { domain, types } = getVoteResultRootDomainDefinition(
    configs.contracts.DaoRegistry,
    offchainContract.address,
    chainId
  );

  const message = JSON.stringify({
    domain,
    message: { root: voteResultTreeHexRoot },
    primaryType: "Message",
    types,
  });

  // Sign root hex result message
  const signature = await signMessage(provider, wallet.address, message);

  // Check if off-chain proof has already been submitted
  // const snapshotOffchainProofExists =
  //   ((await getOffchainVotingProof(voteResultTreeHexRoot))?.merkle_root
  //     .length || "") > 0;

  /**
   * Send off-chain vote proof silently to Snapshot Hub for storage and later use.
   *
   * We're piggy-backing off of the signature async call's status, instead of setting another status.
   * E.g. It may confuse the user if we were to display text saying we're "submitting
   * off-chain proof", or something to this effect, for a second or two.
   */
  // if (!snapshotOffchainProofExists) {
  await submitOffchainVotingProof({
    actionId: offchainContract.address,
    chainId: chainId,
    steps: result,
    merkleRoot: voteResultTreeHexRoot,
    verifyingContract: configs.contracts.DaoRegistry,
  });
  // }

  // Send the tx
  await offchainContract.submitVoteResult(
    configs.contracts.DaoRegistry,
    daoProposalId,
    voteResultTreeHexRoot,
    resultNodeLast,
    signature
  );

  notice(`::: Vote results submitted for DAO Proposal Id ${daoProposalId}!\n`);
};

module.exports = { newOffchainVote, submitOffchainResult };
