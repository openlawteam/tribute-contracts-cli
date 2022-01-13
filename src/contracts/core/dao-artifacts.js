import { ethers } from "ethers";
import { sha3 } from "tribute-contracts/utils/contract-util.js";
import { getContract } from "../../utils/contract.js";

const CONTRACT_NAME = "DaoArtifacts";

export const getOwner = async ({ daoArtifactsAddress }) => {
  const { contract: daoArtifacts } = getContract(
    CONTRACT_NAME,
    daoArtifactsAddress
  );
  return await daoArtifacts.owner();
};

export const addArtifact = async ({
  id,
  version,
  address,
  artifactType,
  daoArtifactsAddress,
}) => {
  const { contract: daoArtifacts } = getContract(
    CONTRACT_NAME,
    daoArtifactsAddress
  );
  return await daoArtifacts.addArtifact(
    sha3(id),
    ethers.utils.formatBytes32String(version),
    address,
    ethers.BigNumber.from(artifactType)
  );
};

export const getArtifactAddress = async ({
  id,
  owner,
  version,
  artifactType,
  daoArtifactsAddress,
}) => {
  const { contract: daoArtifacts } = getContract(
    CONTRACT_NAME,
    daoArtifactsAddress
  );
  return await daoArtifacts.getArtifactAddress(
    sha3(id),
    owner,
    ethers.utils.formatBytes32String(version),
    artifactType
  );
};
