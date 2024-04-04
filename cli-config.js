const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

if (!process.env.DAO_ADDRESS) throw Error("Missing DAO_ADDRESS env var");
if (!process.env.MNEMONIC_OR_PRIVATE_KEY)
  throw Error("Missing MNEMONIC_OR_PRIVATE_KEY env var");
if (!process.env.SNAPSHOT_HUB_SPACE)
  throw Error("Missing SNAPSHOT_HUB_SPACE env var");
if (!process.env.SNAPSHOT_HUB_API_URL)
  throw Error("Missing SNAPSHOT_HUB_API_URL env var");
if (!process.env.ETHEREUM_BLOCKCHAIN_API)
  throw Error("Missing ETHEREUM_BLOCKCHAIN_API env var");
if (!process.env.ETHEREUM_NETWORK)
  throw Error("Missing ETHEREUM_NETWORK env var");
if (!process.env.TOKEN_ADDR) throw Error("Missing env var: <TOKEN_ADDR>");

const configs = {
  dao: process.env.DAO_ADDRESS,
  network: process.env.ETHEREUM_NETWORK,
  ethBlockchainApi: process.env.ETHEREUM_BLOCKCHAIN_API,
  space: process.env.SNAPSHOT_HUB_SPACE,
  snapshotHubApi: process.env.SNAPSHOT_HUB_API_URL,
  debug: process.env.DEBUG === "true",
  mnemonicOrPrivateKey: process.env.MNEMONIC_OR_PRIVATE_KEY,
  ganacheUrl: process.env.GANACHE_URL
    ? process.env.GANACHE_URL
    : "http://localhost:7545",
  infuraApiKey: process.env.INFURA_KEY,
  alchemyApiKey: process.env.ALCHEMY_KEY,
  kmsCredentials: {
    projectId: process.env.KMS_PROJECT_ID,
    locationId: process.env.KMS_LOCATION_ID,
    keyRingId: process.env.KMS_KEY_RING_ID,
    keyId: process.env.KMS_KEY_ID,
    keyVersion: process.env.KMS_KEY_VERSION,
  },
  tokenAddr: process.env.TOKEN_ADDR,
  gasMultiplier: process.env.GAS_MULTIPLIER || 1,
};

module.exports = { configs };
