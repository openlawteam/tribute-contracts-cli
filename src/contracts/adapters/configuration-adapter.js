import Web3 from "web3";
import { ethers } from "ethers";
import { prepareVoteProposalData } from "@openlaw/snapshot-js-erc712";
import { adaptersIdsMap } from "tribute-contracts/utils/dao-ids-util";
import { sha3, ZERO_ADDRESS } from "tribute-contracts/utils/contract-util.js";
import { configs } from "../../../cli-config.js";
import { getAdapter } from "../../utils/contract.js";
import { submitSnapshotProposal } from "../../services/snapshot-service.js";
import { warn } from "../../utils/logging.js";
import {
  checkSenderAddress,
  isProposalReadyToBeProcessed,
} from "./offchain-voting-adapter.js";

const CONTRACT_NAME = "ConfigurationContract";

export const submitConfigurationProposal = async ({ configurations }) => {
  const daoConfigurations = configurations ? parseConfigs(configurations) : [];
  if (daoConfigurations.length === 0)
    throw Error("You need to provide at least 1 dao configuration");

  const {
    contract: configAdapter,
    provider,
    wallet,
  } = await getAdapter(adaptersIdsMap.CONFIGURATION_ADAPTER, CONTRACT_NAME);

  return await submitSnapshotProposal({
    title: `DAO Configuration`,
    description: "Add/update dao configuration",
    actionId: configAdapter.address,
    provider,
    wallet,
  }).then(async (res) => {
    const data = res.data;
    const snapshotProposalId = res.uniqueId;
    const daoProposalId = sha3(snapshotProposalId);
    const message = {
      payload: {
        body: data.payload.body,
        choices: data.payload.choices,
        end: data.payload.end,
        name: data.payload.name,
        snapshot: data.payload.snapshot.toString(),
        start: data.payload.start,
      },
      submitter: wallet.address,
      sig: res.sig,
      space: data.space,
      timestamp: parseInt(data.timestamp),
    };
    if (configs.debug) warn(`DAO Message: ${JSON.stringify(message)}\n`);

    const encodedData = prepareVoteProposalData(message, new Web3(""));
    if (configs.debug) warn(`Encoded DAO message: ${encodedData}\n`);

    await checkSenderAddress({
      adapterAddress: configAdapter.address,
      encodedData,
      sender: wallet.address,
    });

    await configAdapter.submitProposal(
      configs.dao,
      daoProposalId,
      [...daoConfigurations],
      encodedData,
      { from: wallet.address }
    );
    return { daoProposalId, snapshotProposalId };
  });
};

export const processConfigurationProposal = async ({ daoProposalId }) => {
  await isProposalReadyToBeProcessed({ daoProposalId });

  const { contract: configAdapter, wallet } = await getAdapter(
    adaptersIdsMap.CONFIGURATION_ADAPTER,
    CONTRACT_NAME
  );

  await configAdapter.processProposal(configs.dao, daoProposalId, {
    from: wallet.address,
  });

  return { daoProposalId };
};

export const parseConfigs = (inputs) => {
  if (configs.debug) console.log(inputs);
  const configurations = [];
  Array.from(inputs).forEach((i) => {
    if (i.configType === "Numeric") {
      configurations.push({
        key: getKey(i.configKey),
        configType: 0, // Numeric
        numericValue: i.configValue,
        addressValue: ZERO_ADDRESS,
      });
    } else if (i.configType === "Address") {
      configurations.push({
        key: getKey(i.configKey),
        configType: 1, // Address
        numericValue: 0,
        addressValue: ethers.utils.getAddress(i.configValue),
      });
    }
  });
  if (configs.debug) console.log(configurations);
  return configurations;
};

const getKey = (key) => {
  const kycOnboardingKeys = new Set([
    "kyc-onboarding.signerAddress",
    "kyc-onboarding.chunkSize",
    "kyc-onboarding.unitsPerChunk",
    "kyc-onboarding.maximumChunks",
    "kyc-onboarding.maximumTotalUnits",
    "kyc-onboarding.maxMembers",
    "kyc-onboarding.canTopUp",
    "kyc-onboarding.fundTargetAddress",
    "kyc-onboarding.tokensToMint",
  ]);

  if (kycOnboardingKeys.has(key)) {
    if (!process.env.TOKEN_ADDR) {
      throw new Error(
        "Missing proess.env.TOKEN_ADDR needed for kyc onboarding config keys"
      );
    }
    const coder = new ethers.utils.AbiCoder();
    return sha3(
      coder.encode(["address", "bytes32"], [process.env.TOKEN_ADDR, sha3(key)])
    );
  } else {
    return sha3(key);
  }
};
