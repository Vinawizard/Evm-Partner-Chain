const ethers = require('ethers');

const TARGET = "c0495b994bea4f0fd23714fab047d905f339466eac6668b1faed43007be164f7"; // The one holding Punjab data
const TARGET_BASE = "c0495b994bea4f0fd23714fab047d905f339466eac6668b1faed43007be164f6"; // The one holding ID?

const CANDIDATES = [
    "FARM-101", "FARM-001", "101", "1", "Punjab", "0",
    "FARM-101\0", "FARM101"
];

function check(key) {
    const keyHash = ethers.keccak256(ethers.toUtf8Bytes(key));

    // Mode A: keccak(keyHash . 0)
    const slotPadded = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [0]).replace("0x", "");
    const modeA = ethers.keccak256(keyHash + slotPadded);
    const modeA_1 = "0x" + (BigInt(modeA) + 1n).toString(16);

    // Mode B: keccak(keyHash) (Maybe mapping is at 'no slot'?)
    const modeB = ethers.keccak256(keyHash);

    if (modeA === TARGET || modeA_1 === TARGET) console.log(`MATCH Mode A for '${key}'`);
    if (modeB === TARGET) console.log(`MATCH Mode B for '${key}'`);

    console.log(`'${key}' -> ${modeA_1}`);
}

CANDIDATES.forEach(check);
