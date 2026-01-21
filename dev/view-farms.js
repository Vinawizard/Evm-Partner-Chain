const ethers = require('ethers');

// ===== CONFIGURATION =====
const RPC_URL = 'http://127.0.0.1:9944';
const CONTRACT_ADDRESS = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82';
const FARM_IDS = [
    "FARM-101", "FARM-102", "FARM-103", "FARM-104", "FARM-105",
    "FARM-106", "FARM-107", "FARM-108", "FARM-109", "FARM-110"
];

// Helper to calculate the slot for "farms[key].jsonData"
function getJsonStorageSlot(key) {
    // 1. Hash the String Key
    const keyHash = ethers.keccak256(ethers.toUtf8Bytes(key));

    // 2. Mapping is at Slot 0. Pad it to 32 bytes.
    const slot0 = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [0]).replace("0x", "");

    // 3. Calculate Base Slot 'p' = keccak(keyHash . slot0)
    const p = ethers.keccak256(keyHash + slot0);

    // 4. jsonData is at p + 1
    const pBigInt = BigInt(p);
    const jsonSlot = (pBigInt + 1n).toString(16);

    return "0x" + jsonSlot;
}

// Convert Hex to String (Handling Solidity Storage Layout)
function decodeStorageString(hex) {
    if (!hex || hex === '0x') return "<empty>";

    // Remove "0x"
    const raw = hex.substring(2);

    // The last byte (2 chars) tells us if it's short or long
    const lastByte = parseInt(raw.slice(-2), 16);

    // Logic: If last byte is even, it's (length * 2). Data is in the higher bytes.
    // If it's odd, it's a long string (length = lastByte / 2), data is at keccak(slot).
    // For this demo, most of our strings are likely "Short" (<32 bytes) or "Long" (>32 bytes).

    // Actually, let's try a simple "Hex to Utf8" first, as it works 99% of time for debug
    // Filter out trailing zeros
    try {
        const text = ethers.toUtf8String(hex).replace(/\u0000/g, '');
        // Clean up artifacts from length byte if needed
        return text;
    } catch (e) {
        return `[Complex Data] ${hex.substring(0, 20)}...`;
    }
}

async function main() {
    console.log("🔍 READING DATA DIRECTLY FROM STORAGE (Retrieving JSON)...");
    console.log("==================================================================================");

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    for (const id of FARM_IDS) {
        const slot = getJsonStorageSlot(id);

        // Use eth_getStorageAt (Bypasses the buggy eth_call)
        const rawData = await provider.getStorage(CONTRACT_ADDRESS, slot);
        console.log(`[DEBUG] ${id} Slot: ${slot} Raw: ${rawData}`);

        let finalText = "";

        // Strategy 1: Try to decode as string immediately
        try {
            const potentialText = ethers.toUtf8String(rawData).replace(/\x00/g, '');
            if (potentialText.includes("{")) {
                finalText = potentialText; // It was a short string!
            }
        } catch (e) { }

        // Strategy 2: If Strategy 1 failed or looked invalid, treat as Long String Pointer
        if (!finalText) {
            // If rawData is numeric (length), calculate location of actual data
            // Location = keccak256(slot)
            const dataSlot = ethers.keccak256(slot);

            // Read next 3 slots to be safe (JSON might be 60-90 bytes)
            const chunk1 = await provider.getStorage(CONTRACT_ADDRESS, dataSlot);
            const chunk2 = await provider.getStorage(CONTRACT_ADDRESS, "0x" + (BigInt(dataSlot) + 1n).toString(16));
            const chunk3 = await provider.getStorage(CONTRACT_ADDRESS, "0x" + (BigInt(dataSlot) + 2n).toString(16));

            const combined = chunk1 + chunk2.substring(2) + chunk3.substring(2);

            try {
                finalText = ethers.toUtf8String(combined).replace(/\x00/g, '');
            } catch (e) {
                finalText = "[Decoding Failed]";
            }
        }

        console.log(`✅ ${id} : ${finalText}`);
    }
    console.log("==================================================================================");
}

main().catch(console.error);
