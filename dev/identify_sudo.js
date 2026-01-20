// Identify the Sudo key owner
const { Keyring } = require('@polkadot/api');

async function main() {
    const keyring = new Keyring({ type: 'sr25519' });

    // The mystery address
    const targetAddress = '5CXjZn6vAZrtx1V3vFr7PS6bxd67qYAHS2H9UdoE4j1TNwUJ';
    console.log('Target Address:', targetAddress);

    const accounts = [
        '//Alice', '//Bob', '//Charlie', '//Dave', '//Eve', '//Ferdie',
        '//Alice//stash', '//Bob//stash'
    ];

    let found = false;
    for (const uri of accounts) {
        const pair = keyring.addFromUri(uri);
        console.log(`${uri.padEnd(15)}: ${pair.address}`);
        if (pair.address === targetAddress) {
            console.log(`\n🎉 MATCH FOUND! The sudo key is ${uri}`);
            found = true;
            break;
        }
    }

    if (!found) {
        console.log('\n❌ No match found in standard dev accounts.');
    }
}

main().catch(console.error);
