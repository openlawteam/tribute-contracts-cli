const { ethers } = require("ethers");
const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { configs } = require("../../cli-config");

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

const KycOnboardingKeys = [
    { name: "kyc-onboarding.chunkSize", type: "numeric" },
    { name: "kyc-onboarding.signerAddress", type: "address" },
    { name: "kyc-onboarding.maxMembers", type: "numeric" },
    { name: "kyc-onboarding.unitsPerChunk", type: "numeric" },
    { name: "kyc-onboarding.maximumChunks", type: "numeric" },
    { name: "kyc-onboarding.maximumTotalUnits", type: "numeric" },
    { name: "kyc-onboarding.fundTargetAddress", type: "address" },
    { name: "kyc-onboarding.tokensToMint", type: "address" },
];

const OffchainVotingKeys = [
    { name: "offchainvoting.gracePeriod", type: "numeric" },
    { name: "offchainvoting.votingPeriod", type: "numeric" }
];

const getConfigKey = (key) => {
    if (KycOnboardingKeys.map(k => k.name).includes(key)) {
        if (!configs.tokenAddr) {
            throw new Error(
                "Missing process.env.TOKEN_ADDR needed for kyc onboarding config keys"
            );
        }
        const coder = new ethers.utils.AbiCoder();
        return sha3(
            coder.encode(["address", "bytes32"], [configs.tokenAddr, sha3(key)])
        );
    }
    return sha3(key);
};

module.exports = {
    ContractDAOConfigKeys, KycOnboardingKeys, OffchainVotingKeys, getConfigKey
}