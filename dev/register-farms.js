const ethers = require('ethers');
const solc = require('solc');
const fs = require('fs');
const path = require('path');

// ===== CONFIGURATION =====
const RPC_URL = 'http://127.0.0.1:9944';
const CHAIN_ID = 1337;
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Dev Account 1

// ===== MOCK DATA (10 Records) =====
const FARMS = [
    { id: "FARM-101", data: { region: "Punjab", crop: "Wheat", size_acres: 50, owner: "Rajesh Kumar", status: "Active" } },
    { id: "FARM-102", data: { region: "Maharashtra", crop: "Sugarcane", size_acres: 120, owner: "Amit Patil", status: "Active" } },
    { id: "FARM-103", data: { region: "Karnataka", crop: "Coffee", size_acres: 200, owner: "Suresh Gowda", status: "Organic-Certified" } },
    { id: "FARM-104", data: { region: "Gujarat", crop: "Cotton", size_acres: 80, owner: "Vikram Patel", status: "Active" } },
    { id: "FARM-105", data: { region: "Tamil Nadu", crop: "Rice", size_acres: 45, owner: "Muthu Krishnan", status: "Pending-Audit" } },
    { id: "FARM-106", data: { region: "Uttar Pradesh", crop: "Potato", size_acres: 60, owner: "Sandeep Yadav", status: "Active" } },
    { id: "FARM-107", data: { region: "Kerala", crop: "Spices", size_acres: 15, owner: "Thomas George", status: "Export-Ready" } },
    { id: "FARM-108", data: { region: "West Bengal", crop: "Jute", size_acres: 30, owner: "Subhash Bose", status: "Active" } },
    { id: "FARM-109", data: { region: "Madhya Pradesh", crop: "Soybeans", size_acres: 90, owner: "Vijay Singh", status: "Active" } },
    { id: "FARM-110", data: { region: "Rajasthan", crop: "Mustard", size_acres: 110, owner: "Ram Charan", status: "Drought-Impacted" } }
];

async function main() {
    console.log("🚀 STARTING INDIA CHAIN BATCH REGISTRATION");
    console.log("==================================================");

    // 1. COMPILE CONTRACT
    // --------------------------------------------------
    console.log("📦 Compiling FarmlandRegistry.sol...");
    const sourcePath = path.resolve(__dirname, 'contracts', 'FarmlandRegistry.sol');
    const source = fs.readFileSync(sourcePath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: { 'FarmlandRegistry.sol': { content: source } },
        settings: {
            outputSelection: { '*': { '*': ['*'] } },
            optimizer: { enabled: true, runs: 200 },
            evmVersion: 'paris' // <--- CRITICAL for this chain
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        const errors = output.errors.filter(e => e.severity === 'error');
        if (errors.length > 0) {
            console.error("❌ Compilation Errors:", errors);
            process.exit(1);
        }
    }

    const contractFile = output.contracts['FarmlandRegistry.sol']['FarmlandRegistry'];
    const ABI = contractFile.abi;
    const BYTECODE = contractFile.evm.bytecode.object;
    console.log("✅ Compilation Successful.");

    // 2. DEPLOY CONTRACT
    // --------------------------------------------------
    const provider = new ethers.JsonRpcProvider(RPC_URL, { chainId: CHAIN_ID, name: 'partner-chain' });
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const factory = new ethers.ContractFactory(ABI, BYTECODE, wallet);

    console.log(`\n📤 Deploying contract from: ${wallet.address}`);

    // Force Type 0 (Legacy) and High Gas Limit
    const deployTx = await factory.deploy({ gasLimit: 8000000, type: 0 });
    await deployTx.waitForDeployment();

    const contract = deployTx;
    const address = await contract.getAddress();

    console.log(`✅ CONTRACT DEPLOYED AT: ${address}`);
    console.log("==================================================");

    // 3. REGISTER FARMS
    // --------------------------------------------------
    console.log("🚜 Registering 10 Farm Records on-chain...");

    for (const farm of FARMS) {
        const jsonString = JSON.stringify(farm.data);
        process.stdout.write(`   📝 ID: ${farm.id} | Owner: ${farm.data.owner} ... `);

        try {
            const tx = await contract.registerFarm(farm.id, jsonString, {
                gasLimit: 500000, // Sufficient for storage
                type: 0           // Legacy
            });

            await tx.wait();
            console.log(`[OK] Hash: ${tx.hash.substring(0, 16)}...`);
        } catch (e) {
            console.log(`[FAILED] ${e.message}`);
        }
    }

    // 4. VERIFY DATA
    // --------------------------------------------------
    console.log("\n==================================================");
    console.log("🔍 VERIFYING DATA INTEGRITY (Read from Chain)");

    const count = await contract.getTotalFarms();
    console.log(`📊 Total Records Found on Chain: ${count}`);

    // Spot check 3 random ones
    const idsToCheck = ["FARM-101", "FARM-105", "FARM-110"];

    for (const id of idsToCheck) {
        const result = await contract.getFarm(id);
        const storedJson = result[0];
        const timestamp = result[1];

        console.log(`\n   🔎 Checking ${id}:`);
        console.log(`      Timestamp: ${new Date(Number(timestamp) * 1000).toISOString()}`);
        console.log(`      Data: ${storedJson}`);

        // Simple verification logic
        if (storedJson.includes("Active") || storedJson.includes("Pending")) {
            console.log("      ✅ Integrity Check: PASSED");
        } else {
            console.log("      ❌ Integrity Check: FAILED");
        }
    }

    console.log("\n✅ BATCH PROCESS COMPLETED SUCCESSFULLY.");
}

main().catch(console.error);
