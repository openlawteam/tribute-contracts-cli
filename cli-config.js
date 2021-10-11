if (!process.env.DAO_ADDRESS) throw Error("Missing DAO_ADDRESS env var");
if (!process.env.MNEMONIC) throw Error("Missing MNEMONIC env var");
if (!process.env.SNAPSHOT_HUB_SPACE)
  throw Error("Missing SNAPSHOT_HUB_SPACE env var");
if (!process.env.SNAPSHOT_HUB_API_URL)
  throw Error("Missing SNAPSHOT_HUB_API_URL env var");
if (!process.env.ETHEREUM_BLOCKCHAIN_API)
  throw Error("Missing ETHEREUM_BLOCKCHAIN_API env var");
if (!process.env.ETHEREUM_NETWORK)
  throw Error("Missing ETHEREUM_NETWORK env var");

const configs = {
  dao: process.env.DAO_ADDRESS,
  network: process.env.ETHEREUM_NETWORK,
  ethBlockchainApi: process.env.ETHEREUM_BLOCKCHAIN_API,
  space: process.env.SNAPSHOT_HUB_SPACE,
  snapshotHubApi: process.env.SNAPSHOT_HUB_API_URL,
  debug: process.env.DEBUG === "true",
  mnemonic: process.env.MNEMONIC,
  ganacheUrl: process.env.GANACHE_URL
    ? process.env.GANACHE_URL
    : "http://localhost:7545",
};

module.exports = { configs };
