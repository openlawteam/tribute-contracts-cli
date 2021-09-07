### Tribute Contract CLI

### Build

> npm ci

### Setup

From the root folder of the project:

- Create the `contracts.js`, and set the contract's names and addresses from your DAO:
    ```javascript
    const contracts = {
    // DAO Core Contracts
    DaoRegistry: "0x...",

    // Extensions
    BankExtension: "0x...",

    // Adapters
    ManagingContract: "0x...",
    OffchainVotingContract: "0x...",
    };

    module.exports = { contracts };
    ```
- Create the `.env` file, and set the env vars:
    ```
    # The mnemonic to open your wallet and sign transactions
    TRUFFLE_MNEMONIC=...

    # The snapshot-hub URL to connect
    SNAPSHOT_HUB_API_URL=https://...

    # The space name defined in the Snapshot Hub API
    SNAPSHOT_HUB_SPACE=...

    # The Ethereum Network which CLI should interact with: ganache, rinkeby, mainnet
    ETHEREUM_NETWORK=rinkeby

    # Enable DEBUG to see the logs of the CLI interactions with SnapshotHub and DAO
    DEBUG=false

    # Infura Key
    INFURA_KEY=...

    # Alchemy Key
    ALCHEMY_KEY=...
    ```

### Build

> npm run build


### Run

> npm link
> trib --help

### Version Compatibility

|    CLI   | Snapshot-JS | Contracts  |  Snapshot Hub |
|:--------:|:-----------:|:----------:|:------------:|
 [v0.1.1](https://github.com/openlawteam/tribute-contracts-cli/releases/tag/v0.1.1)   | [v1.2.0](https://github.com/openlawteam/snapshot-js-erc712/releases/tag/v1.2.0)      | [v1.0.0](https://github.com/openlawteam/tribute-contracts/releases/tag/v1.0.0)     | [v5.0.0-erc712](https://github.com/openlawteam/snapshot-hub/releases/tag/v5.0.0-erc712)       |
 [v0.2.1](https://github.com/openlawteam/tribute-contracts-cli/releases/tag/v0.2.1)   | [v1.3.0](https://github.com/openlawteam/snapshot-js-erc712/releases/tag/v1.3.0)      | [v2.0.4](https://github.com/openlawteam/tribute-contracts/releases/tag/v2.0.4)     | [v5.0.2-erc712](https://github.com/openlawteam/snapshot-hub/releases/tag/v5.0.2-erc712)      |


### Packages

- NPM: https://www.npmjs.com/package/tribute-contracts-cli
