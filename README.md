### Tribute Contract CLI

### Build

> npm ci

### Setup

- Create the `contracts.js`, and paste the contract names and addresses from your DAO
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

### Compile

> npm run compile
### Run

> npm link
> trib --help