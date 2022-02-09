### Tribute Contract CLI

### Setup

In the root folder of the project, create the `.env` file, and set the env vars:

  ```
  ##
  # The DAO Address to interact with
  DAO_ADDRESS=0x...
  
  ##
  # Infura API KEY or Alchemy API KEY. Pick one.
  INFURA_KEY=
  ALCHEMY_KEY=

  ##
  # 12 word seed phrase from your wallet or the account private key
  MNEMONIC_OR_PRIVATE_KEY=...

  ##
  # The snapshot-hub URL to connect
  SNAPSHOT_HUB_API_URL=http://...

  ##
  # The space name defined in the Snapshot Hub API
  SNAPSHOT_HUB_SPACE=...

  ##
  # Enable DEBUG to see the logs of the CLI interactions with SnapshotHub and DAO
  DEBUG=false

  ## 
  # The API that you are using to connect to Ethereum Blockchain
  # 
  # ALCHEMY Mainnet: https://eth-mainnet.alchemyapi.io/v2/[YOUR_ALCHEMY_API_KEY]
  # ALCHEMY Rinkeby: https://eth-rinkeby.alchemyapi.io/v2/[YOUR_ALCHEMY_API_KEY]
  #
  # INFURA Mainnet: https://mainnet.infura.io/v3/[YOUR_INFURA_API_KEY]
  # INFURA Rinkeby: https://rinkeby.infura.io/v3/[YOUR_INFURA_API_KEY]
  ETHEREUM_BLOCKCHAIN_API=...

  ## 
  # The Ethereum Network which CLI should interact with: ganache, rinkeby, mainnet
  ETHEREUM_NETWORK=..
  ```

### Install

> npm ci

### Build

> npm run build

### Available Commands

> trib --help
### Version Compatibility

|                                        CLI                                         |                                   Snapshot-JS                                   |                                   Contracts                                    |                                      Snapshot Hub                                       |
| :--------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------: | :----------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------: |
| [v0.1.1](https://github.com/openlawteam/tribute-contracts-cli/releases/tag/v0.1.1) | [v1.2.0](https://github.com/openlawteam/snapshot-js-erc712/releases/tag/v1.2.0) | [v1.0.0](https://github.com/openlawteam/tribute-contracts/releases/tag/v1.0.0) | [v5.0.0-erc712](https://github.com/openlawteam/snapshot-hub/releases/tag/v5.0.0-erc712) |
| [v0.1.2](https://github.com/openlawteam/tribute-contracts-cli/releases/tag/v0.1.2) | [v1.2.0](https://github.com/openlawteam/snapshot-js-erc712/releases/tag/v1.2.0) | [v1.0.2](https://github.com/openlawteam/tribute-contracts/releases/tag/v1.0.2) | [v5.0.1-erc712](https://github.com/openlawteam/snapshot-hub/releases/tag/v5.0.1-erc712) |
| [v0.2.1](https://github.com/openlawteam/tribute-contracts-cli/releases/tag/v0.2.1) | [v1.3.0](https://github.com/openlawteam/snapshot-js-erc712/releases/tag/v1.3.0) | [v2.0.4](https://github.com/openlawteam/tribute-contracts/releases/tag/v2.0.4) | [v5.0.2-erc712](https://github.com/openlawteam/snapshot-hub/releases/tag/v5.0.2-erc712) |
| [v0.2.2](https://github.com/openlawteam/tribute-contracts-cli/releases/tag/v0.2.2) | [v1.3.0](https://github.com/openlawteam/snapshot-js-erc712/releases/tag/v1.3.0) | [v2.2.1](https://github.com/openlawteam/tribute-contracts/releases/tag/v2.2.1) | [v5.0.2-erc712](https://github.com/openlawteam/snapshot-hub/releases/tag/v5.0.2-erc712) |
| [v0.2.3](https://github.com/openlawteam/tribute-contracts-cli/releases/tag/v0.2.3) | [v1.3.0](https://github.com/openlawteam/snapshot-js-erc712/releases/tag/v1.3.0) | [v2.3.3](https://github.com/openlawteam/tribute-contracts/releases/tag/v2.3.3) | [v5.0.2-erc712](https://github.com/openlawteam/snapshot-hub/releases/tag/v5.0.2-erc712) |

### Packages

- NPM: https://www.npmjs.com/package/tribute-contracts-cli
