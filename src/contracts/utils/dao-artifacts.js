const { sha3 } = require("tribute-contracts/utils/ContractUtil");
const { getContract } = require("../../utils/contract");
const { ethers } = require("ethers");

const getOwner = async (daoArtifactsAddress) => {
  const { contract } = getContract("DaoArtifacts", daoArtifactsAddress);
  return await contract.owner();
};

const addArtifact = async (id, version, address, type, daoArtifactsAddress) => {
  const { contract } = getContract("DaoArtifacts", daoArtifactsAddress);
  return await contract.addArtifact(
    sha3(id),
    ethers.utils.formatBytes32String(version),
    address,
    type
  );
};

const getArtifactAddress = async (
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

module.exports = {
  getOwner,
  addArtifact,
  getArtifactAddress,
};
