const ethers = require('ethers');

// From Dump:
const ID_SLOT_HEX = "0x58b8bf38babf5deb5955bc00fc8985e430a6dd19ec95d6135eac637ac5cb1b92"; // Line 4's neighbor?
const JSON_CHUNK_HEX = "0xc0495b994bea4f0fd23714fab047d905f339466eac6668b1faed43007be164f7"; // Punjab

// 1. Check if JSON chunk is keccak(ID_SLOT + 1)
const p1 = BigInt(ID_SLOT_HEX) + 1n; // This is the slot where 'jsonData' length/ptr lives (p+1)
// For a Long String, the 'ptr' is the slot itself. The data is at keccak(slot).
// So effective slot for data = keccak(p+1).

const p1_hex = "0x" + p1.toString(16).padStart(64, '0');
const dataPtr = ethers.keccak256(p1_hex);

console.log("Hypothesis: Struct Base is ID_SLOT (0x58b8...)");
console.log("jsonData slot is Base + 1");
console.log("jsonData POINTER hashed (keccak(Base+1)) is:");
console.log(dataPtr);
console.log("\nTarget (Punjab Chunk):");
console.log(JSON_CHUNK_HEX);

if (dataPtr.toLowerCase() === JSON_CHUNK_HEX.toLowerCase()) {
    console.log("🎯 BINGO! The JSON is a Long String stored at keccak(base+1).");
} else {
    console.log("❌ No match.");
}

// 2. Check how we got to ID_SLOT (0x58b8...)
// Is it keccak(key . slot)?
const KEY = "FARM-101";
const keyHash = ethers.keccak256(ethers.toUtf8Bytes(KEY));
// Try slots 0-10
for (let i = 0; i < 10; i++) {
    const slotPadded = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [i]).replace("0x", "");
    const h = ethers.keccak256(keyHash + slotPadded);
    if (h.toLowerCase() === ID_SLOT_HEX.toLowerCase()) {
        console.log(`🎯 FOUND MAPPING SLOT! It is Slot ${i}.`);
    }
}
