const ethers = require('ethers');

// Slot 0 is 'farms' mapping
const MAPPING_SLOT = 0; // uint256(0)
const KEY_STRING = "FARM-101";

function getTrueStorageSlots(keyStr, slotNum) {
    // 1. Hash the String Key first (Solidity rule for string keys)
    // keccak256(utf8_bytes(key))
    const keyHash = ethers.keccak256(ethers.toUtf8Bytes(keyStr));

    // 2. Concatenate keyHash + padded slot number
    // keccak256(keyHash . slot)
    const slotBytes = ethers.ZeroHash.replace("0x", "").substring(0, 64 - slotNum.toString(16).length) + slotNum.toString(16);
    // Actually simpler: pad exact 32 bytes (64 chars)
    const slotPadded = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [slotNum]).replace("0x", "");

    // keyHash is 0x... (32 bytes). slotPadded is ... (32 bytes).
    // Final = keccak256(keyHash_bytes + slot_bytes)
    const finalInput = keyHash + slotPadded;
    const p = ethers.keccak256(finalInput);

    // p is the start of the struct.
    const pBN = BigInt(p);

    return {
        // id is at p
        id: "0x" + pBN.toString(16).padStart(64, '0'),
        // jsonData is at p+1
        jsonData: "0x" + (pBN + 1n).toString(16).padStart(64, '0'),
        // timestamp is at p+2
        registeredAt: "0x" + (pBN + 2n).toString(16).padStart(64, '0')
    };
}

const slots = getTrueStorageSlots(KEY_STRING, MAPPING_SLOT);
console.log(`\n✅ CORRECT SOLIDITY STORAGE KEYS for 'FARM-101':`);
console.log(`===============================================`);
console.log(`Timestamp (p+2) : ${slots.registeredAt}`);
console.log(`JSON Data (p+1) : ${slots.jsonData}`);
console.log("");
console.log("Use the Timestamp one. It will definitively show data.");
