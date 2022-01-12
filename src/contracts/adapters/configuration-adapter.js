import Web3 from "web3";
import { ethers } from "ethers";
import { configs } from "../../../cli-config.js";
import { sha3, toBN } from "tribute-contracts/utils/contract-util.js";
import { prepareVoteProposalData } from "@openlaw/snapshot-js-erc712";
import { getAdapter, getContract } from "../../utils/contract.js";
import { submitSnapshotProposal } from "../../services/snapshot-service.js";
import { warn } from "../../utils/logging.js";
import { checkSenderAddress } from "./offchain-voting-adapter.js";

export const submitConfigurationProposal = async ({ configurations, opts }) => {
  const {
    contract: configAdapter,
    provider,
    wallet,
  } = getAdapter("ConfigurationContract");

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
    if (opts.debug) warn(`DAO Message: ${JSON.stringify(message)}\n`);

    const encodedData = prepareVoteProposalData(message, new Web3(""));
    if (opts.debug) warn(`Encoded DAO message: ${encodedData}\n`);

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
  const { contract: configAdapter, wallet } = getAdapter(
    "ConfigurationContract"
  );

  await configAdapter.processProposal(configs.dao, daoProposalId, {
    from: wallet.address,
  });

  return { daoProposalId };
};
