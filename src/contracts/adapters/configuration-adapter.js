import Web3 from "web3";
import { ethers } from "ethers";
import { prepareVoteProposalData } from "@openlaw/snapshot-js-erc712";
import { sha3, ZERO_ADDRESS } from "tribute-contracts/utils/contract-util.js";
import { configs } from "../../../cli-config.js";
import { getAdapter } from "../../utils/contract.js";
import { submitSnapshotProposal } from "../../services/snapshot-service.js";
import { warn } from "../../utils/logging.js";
import { checkSenderAddress } from "./offchain-voting-adapter.js";

export const submitConfigurationProposal = async ({ configurations }) => {
  const {
    contract: configAdapter,
    provider,
    wallet,
  } = await getAdapter("ConfigurationContract");

  return await submitSnapshotProposal(
    `Key: ${key} -> ${value}`,
    "Creates/Update configuration",
    configAdapter.address,
    provider,
    wallet
  ).then(async (res) => {
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
      [sha3(configurations.key)],
      [configurations.value],
      encodedData,
      { from: wallet.address }
    );
    return { daoProposalId, snapshotProposalId };
  });
};

export const processConfigurationProposal = async ({ daoProposalId }) => {
  const { contract: configAdapter, wallet } = await getAdapter(
    "ConfigurationContract"
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
        key: sha3(i.configKey),
        configType: 0, // Numeric
        numericValue: i.configValue,
        addressValue: ZERO_ADDRESS,
      });
    } else if (i.configType === "Address") {
      configurations.push({
        key: sha3(i.configKey),
        configType: 1, // Address
        numericValue: 0,
        addressValue: ethers.utils.getAddress(i.configValue),
      });
    }
  });
  if (configs.debug) console.log(configurations);
  return configurations;
};
