// Deploy EVM Contract using Sudo to bypass origin restrictions
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { blake2AsHex } = require('@polkadot/util-crypto');

async function main() {
    console.log('🔌 Connecting to node...');

    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider: wsProvider });

    console.log('✅ Connected to:', (await api.rpc.system.chain()).toString());
    console.log('📦 Current block:', (await api.rpc.chain.getHeader()).number.toString());

    // Use Alice (sudo key)
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice');
    console.log('🔑 Alice address:', alice.address);

    // Check if Alice is sudo
    const sudoKey = await api.query.sudo.key();
    console.log('👑 Sudo key:', sudoKey.toString());
    console.log('✅ Alice is sudo:', sudoKey.toString() === alice.address);

    // Derive EVM address for Alice
    const aliceEvmAddress = '0x' + blake2AsHex(alice.publicKey, 256).substring(26);
    console.log('🔗 Alice EVM address:', aliceEvmAddress);

    // Simple contract: stores value 42
    const contractBytecode = '0x6080604052602a6000556011806100166000396000f3006080604052600080fd00';

    console.log('\n🚀 Deploying contract via sudo.sudo(evm.create)...\n');

    try {
        const gasLimit = 500000n;
        const maxFeePerGas = 1000000000n;

        // Create the EVM call
        const evmCall = api.tx.evm.create(
            aliceEvmAddress,      // source
            contractBytecode,     // init
            0,                    // value
            gasLimit,             // gasLimit
            maxFeePerGas,         // maxFeePerGas
            null,                 // maxPriorityFeePerGas
            null,                 // nonce
            [],                   // accessList
            []                    // authorizationList
        );

        // Wrap in sudo
        const sudoCall = api.tx.sudo.sudo(evmCall);

        console.log('📝 Submitting sudo transaction...');

        await new Promise((resolve, reject) => {
            sudoCall.signAndSend(alice, { nonce: -1 }, ({ status, events, dispatchError }) => {
                console.log(`📦 Status: ${status.type}`);

                if (status.isInBlock) {
                    console.log(`\n✅ In block: ${status.asInBlock.toHex()}`);

                    let contractAddress = null;
                    let success = false;

                    events.forEach(({ event }) => {
                        const { section, method, data } = event;

                        // Log key events
                        if (section === 'sudo') {
                            console.log(`  📋 ${section}.${method}:`, data.toHuman());
                        }
                        if (section === 'evm') {
                            console.log(`  📋 ${section}.${method}:`, data.toHuman());
                            if (method === 'Created') {
                                contractAddress = data[0].toString();
                                success = true;
                            }
                        }
                        if (section === 'system' && method === 'ExtrinsicSuccess') {
                            console.log(`  ✅ Extrinsic succeeded!`);
                        }
                        if (section === 'system' && method === 'ExtrinsicFailed') {
                            console.log(`  ❌ Extrinsic failed:`, data.toHuman());
                        }
                    });

                    if (success && contractAddress) {
                        console.log('\n🎉🎉🎉 CONTRACT DEPLOYED SUCCESSFULLY! 🎉🎉🎉');
                        console.log('📍 Contract Address:', contractAddress);
                    }
                }

                if (status.isFinalized) {
                    console.log(`🏁 Finalized: ${status.asFinalized.toHex()}`);
                    resolve();
                }
            });
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await api.disconnect();
    console.log('\n✅ Done!');
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
