// INDIA Chain - Land Registry Interaction Script
// Ethers.js script to interact with Land Registry on Cardano Partner Chain

const { ethers } = require('ethers');

// ===== CONFIGURATION =====
const RPC_URL = 'http://127.0.0.1:9944';
const CHAIN_ID = 1337;

// Funded account (Foundry dev account #1)
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Land Registry Contract ABI (simplified)
const LAND_REGISTRY_ABI = [
    "function registerLand(string location, uint256 area, address owner) returns (uint256)",
    "function getLand(uint256 landId) view returns (string location, uint256 area, address owner, uint256 price, bool isForSale, uint256 registeredAt)",
    "function landCount() view returns (uint256)",
    "function registrar() view returns (address)",
    "function listForSale(uint256 landId, uint256 price)",
    "function buyLand(uint256 landId) payable",
    "event LandRegistered(uint256 indexed landId, string location, uint256 area, address indexed owner)",
    "event LandListedForSale(uint256 indexed landId, uint256 price)",
    "event LandSold(uint256 indexed landId, address indexed from, address indexed to, uint256 price)"
];

// ===== INDIA FARMER LAND DATA =====
const INDIA_LANDS = [
    { location: "INDIA-Maharashtra-FARMER-1-Plot-A", area: 5000, description: "Rice paddy field" },
    { location: "INDIA-Punjab-FARMER-2-Plot-B", area: 10000, description: "Wheat farmland" },
    { location: "INDIA-Karnataka-FARMER-3-Plot-C", area: 7500, description: "Coffee plantation" },
    { location: "INDIA-Gujarat-FARMER-4-Plot-D", area: 12000, description: "Cotton field" },
    { location: "INDIA-TamilNadu-FARMER-5-Plot-E", area: 8000, description: "Sugarcane farm" }
];

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║  🇮🇳 INDIA CHAIN - CARDANO EVM PARTNER CHAIN - LAND REGISTRY 🇮🇳  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');

    // Connect to the Cardano Partner Chain
    const provider = new ethers.JsonRpcProvider(RPC_URL, {
        chainId: CHAIN_ID,
        name: 'cardano-partner-chain'
    });

    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`📡 Connected to: ${RPC_URL}`);
    console.log(`👤 Wallet Address: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    console.log('');

    // Check if contract exists, if not deploy it
    let contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        console.log('📦 Deploying new Land Registry contract...');
        contractAddress = await deployContract(wallet);
    }

    console.log(`📋 Land Registry Contract: ${contractAddress}`);
    console.log('');

    // Connect to the contract
    const landRegistry = new ethers.Contract(contractAddress, LAND_REGISTRY_ABI, wallet);

    // Check current state
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 CURRENT CONTRACT STATE');
    console.log('═══════════════════════════════════════════════════════════════');

    const registrar = await landRegistry.registrar();
    const landCount = await landRegistry.landCount();

    console.log(`   Registrar: ${registrar}`);
    console.log(`   Total Lands Registered: ${landCount.toString()}`);
    console.log('');

    // Register Indian farmer lands
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🌾 REGISTERING INDIAN FARMER LANDS');
    console.log('═══════════════════════════════════════════════════════════════');

    for (const land of INDIA_LANDS) {
        console.log(`\n   📍 Registering: ${land.location}`);
        console.log(`      Area: ${land.area} sq.m | Type: ${land.description}`);

        try {
            const tx = await landRegistry.registerLand(
                land.location,
                land.area,
                wallet.address,
                {
                    gasLimit: 500000,
                    gasPrice: ethers.parseUnits('1', 'gwei')
                }
            );

            console.log(`      TX Hash: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`      ✅ Confirmed in block: ${receipt.blockNumber}`);

            // Parse events
            for (const log of receipt.logs) {
                try {
                    const parsed = landRegistry.interface.parseLog(log);
                    if (parsed && parsed.name === 'LandRegistered') {
                        console.log(`      🆔 Land ID: ${parsed.args.landId.toString()}`);
                    }
                } catch (e) { }
            }
        } catch (error) {
            console.log(`      ⚠️ Error: ${error.message.substring(0, 50)}...`);
        }
    }

    // Display all registered lands
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📜 ALL REGISTERED LANDS ON INDIA CHAIN');
    console.log('═══════════════════════════════════════════════════════════════');

    const totalLands = await landRegistry.landCount();
    console.log(`\n   Total Lands: ${totalLands.toString()}\n`);

    for (let i = 1; i <= totalLands; i++) {
        try {
            const land = await landRegistry.getLand(i);
            console.log(`   ┌─ Land #${i} ─────────────────────────────────────────────`);
            console.log(`   │ Location: ${land.location}`);
            console.log(`   │ Area: ${land.area.toString()} sq.m`);
            console.log(`   │ Owner: ${land.owner}`);
            console.log(`   │ For Sale: ${land.isForSale ? '✅ Yes' : '❌ No'}`);
            if (land.isForSale) {
                console.log(`   │ Price: ${ethers.formatEther(land.price)} ETH`);
            }
            console.log(`   │ Registered: Block timestamp ${land.registeredAt.toString()}`);
            console.log(`   └────────────────────────────────────────────────────────`);
        } catch (e) {
            console.log(`   Land #${i}: Error fetching - ${e.message}`);
        }
    }

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔗 HOW TO VIEW IN POLKADOT.js');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`
   1. Open: https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944
   
   2. View Contract Code:
      Developer → Chain State → evm → accountCodes
      Enter: ${contractAddress}
   
   3. View Contract Storage (land data):
      Developer → Chain State → evm → accountStorages
      Address: ${contractAddress}
      Key: 0x0000000000000000000000000000000000000000000000000000000000000000
   
   4. View Recent Blocks:
      Network → Explorer → Search block number
`);

    console.log('✅ INDIA CHAIN LAND REGISTRY DEMO COMPLETE!');
}

async function deployContract(wallet) {
    // Read bytecode from file
    const fs = require('fs');
    const bytecode = fs.readFileSync('/tmp/land_registry_bytecode.txt', 'utf8').trim();

    const factory = new ethers.ContractFactory(LAND_REGISTRY_ABI, bytecode, wallet);

    const contract = await factory.deploy({
        gasLimit: 5000000,
        gasPrice: ethers.parseUnits('1', 'gwei')
    });

    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`   ✅ Deployed to: ${address}`);

    return address;
}

main().catch(console.error);
