import Web3 from "web3";
import { ethers } from "ethers";
import { configs } from "../../../cli-config.js";
import { sha3 } from "tribute-contracts/utils/contract-util.js";
import { prepareVoteProposalData } from "@openlaw/snapshot-js-erc712";
import {
  daoAccessFlags,
  entryDao,
  entryBank,
  entryERC1271,
  entryExecutor,
  entryERC721,
  entryERC1155,
  parseSelectedFlags,
} from "tribute-contracts/utils/access-control-util.js";
import { getContract } from "../../utils/contract.js";
import { submitSnapshotProposal } from "../../services/snapshot-service.js";
import {
  getExtensionAddress,
  getAdapterAddress,
} from "../core/dao-registry.js";
import { warn } from "../../utils/logging.js";

const toBytes32 = ethers.utils.formatBytes32String;

export const submitManagingProposal = async (
  updateType,
  adapterName,
  adapterAddress,
  selectedDaoAclFlags,
  extensions,
  keys,
  values,
  opts
) => {
  const configKeys = keys ? keys.split(",").map((k) => toBytes32(k)) : [];
  const configValues = values ? values.split(",").map((v) => v) : [];
  const configAclFlags = parseSelectedFlags(
    daoAccessFlags,
    selectedDaoAclFlags,
    "DaoRegisty"
  );
  const managingContractAddress = await getAdapterAddress("managing");

  const { contract, provider, wallet } = getContract(
    "ManagingContract",
    managingContractAddress
  );

  const { extensionAddresses, extensionAclFlags } = await validateExtensions(
    extensions
  );

  return await submitSnapshotProposal(
    `Adapter: ${adapterName}`,
    "Creates/Update adapter",
    managingContractAddress,
    provider,
    wallet
  ).then(async (res) => {
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
      submitter: wallet.address,
      sig: res.sig,
      space: data.space,
      timestamp: parseInt(data.timestamp),
    };
    if (opts.debug) warn(`DAO Message: ${JSON.stringify(message)}\n`);

    const encodedData = prepareVoteProposalData(message, new Web3(""));
    if (opts.debug) warn(`Encoded DAO message: ${encodedData}\n`);

    await contract.submitProposal(
      configs.dao,
      daoProposalId,
      {
        adapterOrExtensionId: sha3(adapterName),
        adapterOrExtensionAddr: adapterAddress,
        updateType: updateType,
        flags: entryDao(
          adapterName,
          adapterAddress,
          { dao: undefined, extensions: undefined } //configAclFlags}
        ).flags,
        keys: configKeys,
        values: configValues,
        extensionAddresses: extensionAddresses,
        extensionAclFlags: extensionAclFlags,
      },
      encodedData ? encodedData : ethers.utils.toUtf8Bytes(""),
      { from: wallet.address }
    );

    return { daoProposalId, snapshotProposalId };
  });
};

export const processManagingProposal = async (daoProposalId) => {
  const managingContractAddress = await getAdapterAddress("managing");
  const { contract, wallet } = getContract(
    "ManagingContract",
    managingContractAddress
  );

  await contract.processProposal(configs.dao, daoProposalId, {
    from: wallet.address,
  });

  return { daoProposalId };
};

/**
 * Validates if the selected extensions exist in the DAO,
 * and converts the selected ACL flags of each extension
 * to its corresponding integer value.
 *
 * @param {*} extensions
 * @returns extensionAddresses
 * @returns extensionAclFlags
 */
const validateExtensions = async (extensions) => {
  let extensionAddresses = [];
  let extensionAclFlags = [];
  if (!extensions || extensions.length === 0)
    return { extensionAddresses, extensionAclFlags };

  for (let i in extensions) {
    const ext = extensions[i];
    extensionAddresses.push(await getExtensionAddress(ext.id));

    const parsedAclFlags = parseSelectedFlags(
      ext.aclFlags,
      ext.selectedFlags,
      ext.name
    );
    // switch (ext.id) {
    //   case "bank":
    //     extensionAclFlags.push(
    //       entryBank({ address: undefined }, parsedAclFlags).flags
    //     );
    //     break;
    //   case "nft":
    //     extensionAclFlags.push(
    //       entryERC721({ address: undefined }, parsedAclFlags).flags
    //     );
    //     break;
    //   case "erc1155-ext":
    //     extensionAclFlags.push(
    //       entryERC1155({ address: undefined }, parsedAclFlags).flags
    //     );
    //     break;
    //   case "erc1271":
    //     extensionAclFlags.push(
    //       entryERC1271({ address: undefined }, parsedAclFlags).flags
    //     );
    //     break;
    //   case "erc1271":
    //     extensionAclFlags.push(
    //       entryExecutor({ address: undefined }, parsedAclFlags).flags
    //     );
    //     break;
    //   default:
    //     throw Error(`ACL flag not supported for extension: ${ext.name}`);
    // }
  }
  return { extensionAddresses, extensionAclFlags };
};
