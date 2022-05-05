const {
    success,
    notice,
} = require("../../../utils/logging");

const { createRandomWallet } = require("../../../utils/signer");

const utilsCommands = (program) => {
    program
        .command("new-wallet")
        .description("Creates a new random wallet.")
        .action(async () => {
            notice(`\n::: Creating wallet with ethers.js...\n`);
            const wallet = createRandomWallet();
            success(`::: Address: ${await wallet.getAddress()}`);
            success(`::: PrivateKey: ${wallet.privateKey}`);
            success(`::: Mnemonic: ${wallet.mnemonic.phrase}`);
            success(`::: Path: ${wallet.mnemonic.path}`);
            success(`::: Locale: ${wallet.mnemonic.locale}`);
            success(`\nNew wallet created`, true);
        });
}


module.exports = { utilsCommands, };
