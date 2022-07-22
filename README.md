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

    # The token used for onboarding, typically ETH (0x0000000000000000000000000000000000000000)
    TOKEN_ADDR=0x...
    ```

### Compile

> npm run compile
### Run

> npm link
> trib --help

### Version Compatibility

| Contracts |     UI       |    CLI   | Snapshot
:----------:|:------------:|:--------:|:--------:|
 v1.0.0     | v1.1.0       | v0.1.1   | v1.2.0