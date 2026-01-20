// Decode Sudo key and verify if it matches Alice's keys
const { Keyring } = require('@polkadot/api');
const { u8aToHex } = require('@polkadot/util');
const { decodeAddress, encodeAddress } = require('@polkadot/util-crypto');

async function main() {
    const sudoKey = '5CXjZn6vAZrtx1V3vFr7PS6bxd67qYAHS2H9UdoE4j1TNwUJ';
    console.log('Sudo Key SS58:', sudoKey);

    // Decode
    const sudoHex = u8aToHex(decodeAddress(sudoKey));
    console.log('Sudo Key Hex:', sudoHex);

    // Alice Keys
    const keyringSr = new Keyring({ type: 'sr25519' });
    const aliceSr = keyringSr.addFromUri('//Alice');
    console.log('Alice SR25519 Hex:', u8aToHex(aliceSr.publicKey));

    const keyringEd = new Keyring({ type: 'ed25519' });
    const aliceEd = keyringEd.addFromUri('//Alice');
    console.log('Alice ED25519 Hex:', u8aToHex(aliceEd.publicKey));

    const keyringEc = new Keyring({ type: 'ecdsa' });
    const aliceEc = keyringEc.addFromUri('//Alice');
    console.log('Alice ECDSA Hex:  ', u8aToHex(aliceEc.publicKey));

    // Check match
    if (sudoHex === u8aToHex(aliceSr.publicKey)) console.log('✅ Matches Alice SR25519');
    if (sudoHex === u8aToHex(aliceEd.publicKey)) console.log('✅ Matches Alice ED25519');
    if (sudoHex === u8aToHex(aliceEc.publicKey)) console.log('✅ Matches Alice ECDSA');
    // ECDSA might be truncated or hashed for AccountId?
    // Substrate AccountId is 32 bytes. ECDSA public key is 33 bytes.
    // Usually usage is Blake2(pubkey)

}

main().catch(console.error);
