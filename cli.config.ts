import dotenv from "dotenv";
dotenv.config({ path: ".env" });

if (!process.env.ETHEREUM_NETWORK)
  throw Error("Missing ETHEREUM_NETWORK env var");
if (!process.env.SNAPSHOT_HUB_SPACE)
  throw Error("Missing SNAPSHOT_HUB_SPACE env var");
if (!process.env.SNAPSHOT_HUB_API_URL)
  throw Error("Missing SNAPSHOT_HUB_API_URL env var");
if (!process.env.TRUFFLE_MNEMONIC)
  throw Error("Missing env var: <TRUFFLE_MNEMONIC>");

const contracts = {
  // DAO Core Contracts
  DaoRegistry: "0xf68f5498DD766A8d65c4785219d61FCC5E0E920A",

  // Extensions
  BankExtension: "0x141f5fCa84Cc82EF0A6751241019471731289456",

  // Adapters
  ManagingContract: "0xb09bCc172050fBd4562da8b229Cf3E45Dc3045A6",
  OffchainVotingContract: "0x4339316e04CFfB5961D1c41fEF8E44bfA2A7fBd1",

  // Helpers
  Multicall: "0x47a2Db5D68751EeAdFBC44851E84AcDB4F7299Cc",
}

export const configs = {
  network: process.env.ETHEREUM_NETWORK,
  space: process.env.SNAPSHOT_HUB_SPACE,
  snapshotHubApi: process.env.SNAPSHOT_HUB_API_URL,
  debug: process.env.DEBUG === "true",
  contracts: contracts,
  infuraApiKey: process.env.INFURA_KEY,
  alchemyApiKey: process.env.ALCHEMY_KEY,
  truffleMnemonic: process.env.TRUFFLE_MNEMONIC,
  ganacheUrl: process.env.GANACHE_URL
    ? process.env.GANACHE_URL
    : "http://localhost:7545",
};
