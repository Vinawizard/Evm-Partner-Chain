const { ethers } = require('ethers');

// RPC Configuration
const RPC_URL = 'http://127.0.0.1:9944';
const CHAIN_ID = 1337;
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Dev Account 1

// Simple Storage Contract (compatible with Paris EVM)
// function store(uint256 num)
// function retrieve() returns (uint256)
const ABI = [
    "function store(uint256 num)",
    "function retrieve() view returns (uint256)"
];

// Bytecode for Storage contract (Solidity 0.8.19 / Paris)
const BYTECODE = "0x608060405234801561001057600080fd5b5061012a806100206000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460385780636057361d146048575b600080fd5b600054605e906064565b60405190815260200160405180910390f35b605c600480360381019060589190607d565b600055565b005b6000819050919050565b600080fd5b6000819050919050565b61009881610086565b81146100a357600080fd5b50565b6000813590506100b48161008f565b92915050565b6000602082840312156100cf57600080fd5b60006100dd848285016100a6565b9150509291505056fea26469706673582212209796850c95231c519391054f464010373801f6004a434771249927656e13b82764736f6c63430008130033";

async function main() {
    console.log(`Connecting to ${RPC_URL}...`);
    const provider = new ethers.JsonRpcProvider(RPC_URL, {
        chainId: CHAIN_ID,
        name: 'partner-chain'
    });

    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Deploying with account: ${wallet.address}`);

    const factory = new ethers.ContractFactory(ABI, BYTECODE, wallet);

    // We force the gas limit high to ensure it passes
    const contract = await factory.deploy({
        gasLimit: 5000000
    });

    console.log(`Transaction sent! Hash: ${contract.deploymentTransaction().hash}`);

    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`\n✅ CONTRACT DEPLOYED SUCCESSFULLY!`);
    console.log(`📍 Address: ${address}`);

    // Test Interaction
    console.log(`\nTesting interaction... storing value 42`);
    const tx = await contract.store(42);
    await tx.wait();

    const val = await contract.retrieve();
    console.log(`📢 Retrieved value: ${val.toString()}`);
}

main().catch(console.error);
