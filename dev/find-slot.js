const ethers = require('ethers');

const KEY = "FARM-101";
const TARGET_SLOT_END = "64f7"; // From screenshot line 7

function trySlot(mappingSlot) {
    const keyHash = ethers.keccak256(ethers.toUtf8Bytes(KEY));
    const slotPadded = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [mappingSlot]).replace("0x", "");
    const finalInput = keyHash + slotPadded;
    const p = ethers.keccak256(finalInput);

    // Check offsets
    const pBN = BigInt(p);
    const p0 = p;
    const p1 = "0x" + (pBN + 1n).toString(16);

    console.log(`Slot ${mappingSlot}:`);
    console.log(`   Base: ${p0}`);
    console.log(`   +1  : ${p1}`);

    if (p0.endsWith(TARGET_SLOT_END) || p1.endsWith(TARGET_SLOT_END)) {
        console.log("   🎯 MATCH FOUND!");
    }
}

console.log("Searching for slot ending in " + TARGET_SLOT_END);
for (let i = 0; i < 10; i++) {
    trySlot(i);
}
