// Update mock-registrations.json to use Alice's keys
const { Keyring } = require('@polkadot/api');
const { u8aToHex } = require('@polkadot/util');
const fs = require('fs');

async function main() {
    // 1. Setup keys
    const keyringSr = new Keyring({ type: 'sr25519' });
    const aliceSr = keyringSr.addFromUri('//Alice');

    const keyringEd = new Keyring({ type: 'ed25519' });
    const aliceEd = keyringEd.addFromUri('//Alice');

    const keyringEc = new Keyring({ type: 'ecdsa' });
    const aliceEc = keyringEc.addFromUri('//Alice');

    console.log('Alice SR25519:', u8aToHex(aliceSr.publicKey));
    console.log('Alice ED25519:', u8aToHex(aliceEd.publicKey));
    console.log('Alice ECDSA:', u8aToHex(aliceEc.publicKey));

    // 2. Read existing file to preserve structure
    // But since we know it's simple, let's just create the object
    // We need 64-byte signatures or they fail (as we learned)
    const zeroSig64 = "0x" + "00".repeat(64);
    const zeroSig32 = "0x" + "00".repeat(32); // Sidechain sig might be 32 or 64? Usually 64 for Ed25519/Sr25519

    // The previous file had:
    // mainchain_signature: 64 bytes (we fixed this)
    // sidechain_signature: 32 bytes (was this causing issues? no, node ran)
    // Let's stick to what worked but update KEYS

    const registration = {
        "permissioned": [
            {
                "name": "Alice Permissioned",
                "sidechain_pub_key": u8aToHex(aliceEc.publicKey), // 33 bytes for compressed ECDSA
                "aura_pub_key": u8aToHex(aliceSr.publicKey),      // 32 bytes
                "grandpa_pub_key": u8aToHex(aliceEd.publicKey)    // 32 bytes
            }
        ],
        "registrations": [
            {
                "name": "Alice Registered",
                "sidechain_pub_key": u8aToHex(aliceEc.publicKey),
                "mainchain_pub_key": "0x0000000000000000000000000000000000000000000000000000000000000000", // Keep dummy
                "mainchain_signature": zeroSig64, // Keep dummy 64 bytes
                "sidechain_signature": zeroSig64, // Updates to 64 bytes just in case
                "registration_utxo": "0x0000000000000000000000000000000000000000000000000000000000000000#0",
                "status": "Active",
                "aura_pub_key": u8aToHex(aliceSr.publicKey),
                "grandpa_pub_key": u8aToHex(aliceEd.publicKey)
            }
        ],
        "nonce": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "d_parameter": {
            "permissioned": 16,
            "registered": 16
        }
    };

    // Wrap in array as per original file
    const content = [registration];

    fs.writeFileSync('mock-registrations.json', JSON.stringify(content, null, 4));
    console.log('✅ Updated dev/mock-registrations.json with Alice\'s keys');
}

main().catch(console.error);
