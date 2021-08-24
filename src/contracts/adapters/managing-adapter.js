import Web3 from "web3";
import { ethers } from "ethers";
import { configs } from "../../../cli.config.js";
const toBytes32 = ethers.utils.formatBytes32String;

import { sha3 } from "tribute-contracts/utils/ContractUtil.js";
import { prepareVoteProposalData } from "@openlaw/snapshot-js-erc712";
import { entryDao } from "tribute-contracts/utils/DeploymentUtil.js";
import { getContract } from "../../utils/contract.js";
import { submitSnapshotProposal } from "../../services/snapshot-service.js";
import { parseDaoFlags } from "../core/dao-registry.js";
import { warn } from "../../utils/logging.js";

export const submitManagingProposal = async ({
  adapterName,
  adapterAddress,
  aclFlags,
  keys,
  values,
  data,
  opts,
}) => {
  const configKeys = keys ? keys.split(",").map((k) => toBytes32(k)) : [];
  const configValues = values ? values.split(",").map((v) => v) : [];
  const configAclFlags = parseDaoFlags(aclFlags);

  const { contract, provider, wallet } = getContract(
    "ManagingContract",
    configs.contracts.ManagingContract
  );

  return await submitSnapshotProposal({
    title: `Adapter: ${adapterName}`,
    description: "Creates/Update adapter",
    actionId: configs.contracts.ManagingContract,
    provider,
    wallet,
  }).then(async (res) => {
    const data = res.data;
    const snapshotProposalId = res.uniqueId;
    const daoProposalId = sha3(snapshotProposalId);

    if (opts.debug) warn(`Snapshot Message: ${JSON.stringify(data)}\n`);
    const message = {
      payload: {
        body: data.payload.body,
        choices: data.payload.choices,
        end: data.payload.end,
        name: data.payload.name,
        snapshot: data.payload.snapshot.toString(),
        start: data.payload.start,
      },
      sig: res.sig,
      space: data.space,
      timestamp: parseInt(data.timestamp),
    };
    if (opts.debug) warn(`DAO Message: ${JSON.stringify(message)}\n`);

    const encodedData = prepareVoteProposalData(message, new Web3(""));
    if (opts.debug) warn(`Encoded DAO message: ${encodedData}\n`);

    await contract.submitProposal(
      configs.contracts.DaoRegistry,
      daoProposalId,
      {
        adapterId: sha3(adapterName),
        adapterAddress: adapterAddress,
        flags: entryDao(
          adapterName,
          { address: adapterAddress },
          configAclFlags
        ).flags,
      },
      configKeys,
      configValues,
      encodedData ? encodedData : ethers.utils.toUtf8Bytes(""),
      { from: wallet.address }
    );
    return { daoProposalId, snapshotProposalId };
  });
};

export const processManagingProposal = async ({ daoProposalId }) => {
  const { contract, wallet } = getContract(
    "ManagingContract",
    configs.contracts.ManagingContract
  );

  await contract.processProposal(configs.contracts.DaoRegistry, daoProposalId, {
    from: wallet.address,
  });

  return { daoProposalId };
};
