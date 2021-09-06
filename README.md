### Tribute Contract CLI

### Build

> npm run build

### Setup

From the root folder of the project:

- Rename the `sample-contracts.js` to `contracts.js`, and set the contract's names and addresses from the DAO that you want to interact with:
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
    ETHEREUM_NETWORK=...

    # Enable DEBUG to see the logs of the CLI interactions with SnapshotHub and DAO
    DEBUG=false

    # You can use either one of the following API keys to connect to eth network (rinkeby/mainnet)
    INFURA_KEY=...
    # ALCHEMY_KEY=...
    
    ```

### Run

> npm link
> trib --help

### Version Compatibility

|    CLI   | Snapshot-JS | Contracts  |  Snapshot Hub |
|:--------:|:-----------:|:----------:|:------------:|
 [v0.1.1](https://github.com/openlawteam/tribute-contracts-cli/releases/tag/v0.1.1)   | [v1.2.0](https://github.com/openlawteam/snapshot-js-erc712/releases/tag/v1.2.0)      | [v1.0.0](https://github.com/openlawteam/tribute-contracts/releases/tag/v1.0.0)     | [v5.0.0-erc712](https://github.com/openlawteam/snapshot-hub/releases/tag/v5.0.0-erc712)       |
 [v0.2.0](https://github.com/openlawteam/tribute-contracts-cli/releases/tag/v0.2.0)   | [v1.3.0](https://github.com/openlawteam/snapshot-js-erc712/releases/tag/v1.3.0)      | [v2.0.4](https://github.com/openlawteam/tribute-contracts/releases/tag/v2.0.4)     | [v5.0.1-erc712](https://github.com/openlawteam/snapshot-hub/releases/tag/v5.0.1-erc712)      |


### Packages

- NPM: https://www.npmjs.com/package/tribute-contracts-cli
