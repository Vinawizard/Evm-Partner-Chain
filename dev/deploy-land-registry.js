// Deploy Land Registry Contract via sudo → evm.create
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { blake2AsHex } = require('@polkadot/util-crypto');
const fs = require('fs');

async function main() {
    console.log('🔌 Connecting to node...');

    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider: wsProvider });

    console.log('✅ Connected to:', (await api.rpc.system.chain()).toString());
    console.log('📦 Current block:', (await api.rpc.chain.getHeader()).number.toString());

    // Get sudo key
    const sudoKeyAddress = (await api.query.sudo.key()).toString();
    console.log('👑 Sudo key address:', sudoKeyAddress);

    // Setup keyring - try Alice first, then find the right one
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice');

    // Check who is sudo
    let sudoAccount;
    if (alice.address === sudoKeyAddress) {
        sudoAccount = alice;
        console.log('✅ Alice is sudo');
    } else {
        // Try well-known dev accounts
        const devAccounts = ['//Bob', '//Charlie', '//Dave', '//Eve', '//Ferdie'];
        for (const uri of devAccounts) {
            const acc = keyring.addFromUri(uri);
            if (acc.address === sudoKeyAddress) {
                sudoAccount = acc;
                console.log(`✅ ${uri.replace('//', '')} is sudo`);
                break;
            }
        }
    }

    if (!sudoAccount) {
        console.log('⚠️  Sudo key not in standard dev accounts');
        console.log('Using Alice anyway for this demo (will use sudo.sudoUncheckedWeight)');
        sudoAccount = alice;
    }

    // Read bytecode
    const bytecode = fs.readFileSync('/tmp/land_registry_bytecode.txt', 'utf8').trim();
    console.log('📜 Contract bytecode length:', bytecode.length, 'chars');

    // Derive EVM address for the account
    const evmAddress = '0x' + blake2AsHex(sudoAccount.publicKey, 256).substring(26);
    console.log('🔗 Deployer EVM address:', evmAddress);

    console.log('\n🚀 Deploying Land Registry contract via sudo.sudoUncheckedWeight(evm.create)...\n');

    try {
        const gasLimit = 5000000n;  // 5M gas for larger contract
        const maxFeePerGas = 1000000000n;  // 1 Gwei

        // Create the EVM create call
        const evmCall = api.tx.evm.create(
            evmAddress,           // source - deployer EVM address
            bytecode,             // init - contract bytecode
            0,                    // value - no ETH sent
            gasLimit,             // gasLimit
            maxFeePerGas,         // maxFeePerGas
            null,                 // maxPriorityFeePerGas
            null,                 // nonce
            [],                   // accessList
            []                    // authorizationList
        );

        // Wrap in sudo.sudoUncheckedWeight (bypasses origin check)
        // Use a high weight to ensure it goes through
        const weight = { refTime: 100000000000n, proofSize: 1000000n };
        const sudoCall = api.tx.sudo.sudoUncheckedWeight(evmCall, weight);

        console.log('📝 Submitting sudo transaction...');

        let contractAddress = null;

        await new Promise((resolve, reject) => {
            sudoCall.signAndSend(sudoAccount, { nonce: -1 }, ({ status, events, dispatchError }) => {
                console.log(`📦 Status: ${status.type}`);

                if (status.isInBlock) {
                    console.log(`\n✅ Included in block: ${status.asInBlock.toHex()}`);

                    events.forEach(({ event }) => {
                        const { section, method, data } = event;

                        if (section === 'sudo') {
                            console.log(`  📋 ${section}.${method}`);
                            if (method === 'Sudid') {
                                const result = data[0];
                                if (result.isOk) {
                                    console.log('  ✅ Sudo call succeeded!');
                                } else {
                                    console.log('  ❌ Sudo call failed:', result.asErr.toHuman());
                                }
                            }
                        }

                        if (section === 'evm') {
                            console.log(`  📋 ${section}.${method}:`, data.toHuman());
                            if (method === 'Created') {
                                contractAddress = data[0].toString();
                            }
                            if (method === 'CreatedFailed') {
                                console.log('  ❌ Contract creation failed');
                            }
                        }

                        if (section === 'system' && method === 'ExtrinsicSuccess') {
                            console.log(`  ✅ Extrinsic succeeded`);
                        }
                        if (section === 'system' && method === 'ExtrinsicFailed') {
                            const error = data[0];
                            if (error.isModule) {
                                const decoded = api.registry.findMetaError(error.asModule);
                                console.log(`  ❌ Failed: ${decoded.section}.${decoded.name}`);
                            }
                        }
                    });

                    if (contractAddress) {
                        console.log('\n🎉🎉🎉 LAND REGISTRY CONTRACT DEPLOYED! 🎉🎉🎉');
                        console.log('📍 Contract Address:', contractAddress);
                        console.log('\nSave this address for calling the contract!');

                        // Save to file
                        fs.writeFileSync('/tmp/land_registry_address.txt', contractAddress);
                    }
                }

                if (status.isFinalized) {
                    console.log(`\n🏁 Finalized: ${status.asFinalized.toHex()}`);
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
