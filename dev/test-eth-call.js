const { ethers } = require("ethers");

// Connect to the local Partner Chain node
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:9944");

// ABI for the FarmlandRegistry contract (getFarm function match)
const abi = [
    "function getFarm(string memory _farmId) view returns (string memory jsonData, uint256 registeredAt)"
];

// Deployed contract address
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
    try {
        console.log(`Connecting to ${contractAddress}...`);
        const contract = new ethers.Contract(contractAddress, abi, provider);

        console.log("Calling getFarm('FARM-101')...");
        // This triggers eth_call
        const result = await contract.getFarm("FARM-101");

        console.log("✅ Success! Result received:");
        console.log("JSON Data:", result.jsonData);
        console.log("Timestamp:", result.registeredAt.toString());

    } catch (e) {
        console.error("❌ Error calling getFarm:");
        if (e.info) console.error("Info:", e.info);
        if (e.error) console.error("RPC Error:", e.error);
        if (e.shortMessage) console.error("Message:", e.shortMessage);
        else console.error(e);
    }
}

main();
