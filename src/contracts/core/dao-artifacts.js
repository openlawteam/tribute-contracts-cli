import { ethers } from "ethers";
import { sha3 } from "tribute-contracts/utils/contract-util.js";
import { getContract } from "../../utils/contract.js";

export const getOwner = async (daoArtifactsAddress) => {
  const { contract } = getContract("DaoArtifacts", daoArtifactsAddress);
  return await contract.owner();
};

export const addArtifact = async (
  id,
  version,
  address,
  type,
  daoArtifactsAddress
) => {
  const { contract } = getContract("DaoArtifacts", daoArtifactsAddress);
  return await contract.addArtifact(
    sha3(id),
    ethers.utils.formatBytes32String(version),
    address,
    type
  );
};

export const getArtifactAddress = async (
  id,
  owner,
  version,
  type,
  daoArtifactsAddress
) => {
  const { contract } = getContract("DaoArtifacts", daoArtifactsAddress);
  return await contract.getArtifactAddress(
    sha3(id),
    owner,
    ethers.utils.formatBytes32String(version),
    type
  );
};
