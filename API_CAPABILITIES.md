# Partner Chains API & Capability Guide

This document provides a comprehensive overview of the capabilities unlocked by your Partner Chain node. It covers the dual nature of the system:
1.  **EVM Compatibility** (Ethereum-like features)
2.  **Substrate Native Features** (Pallets & RPCs)

---

## 1. Ethereum / EVM Capabilities
Your node runs **Frontier**, which provides full Ethereum Virtual Machine compatibility. You can interact with it using standard tools like `ethers.js`, `web3.py`, `Remix`, `Metamask`, `Hardhat`, and `Foundry`.

### RPC Methods (JSON-RPC)
The node exposes a standard Ethereum JSON-RPC API on port `9944`.

| Category | Method | Description |
| :--- | :--- | :--- |
| **Gossip** | `eth_sendRawTransaction` | Submit signed transactions (deploy contract, transfer tokens, interact). |
| **State** | `eth_call` | Read contract state without gas (Simulates execution). |
| | `eth_getBalance` | Get account balance (Native tokens are mapped 1:1). |
| | `eth_getStorageAt` | Read raw storage slots (Low-level). |
| | `eth_getCode` | Fetch contract bytecode. |
| | `eth_getTransactionCount` | Get nonce for an account. |
| **Chain** | `eth_chainId` | Returns `1337` (or configured Chain ID). |
| | `eth_blockNumber` | Current block height (synced with Substrate blocks). |
| | `eth_getBlockByNumber` | Get full block details. |
| **Gas** | `eth_estimateGas` | Simulate execution to determine gas usage. |
| | `eth_gasPrice` | Current gas price (Dynamic Fee support). |
| **Events** | `eth_getLogs` | Fetch emitted events (e.g., `FarmRegistered`). |

### Smart Contract Capabilities (Solidity)
You can write and deploy ANY standard Solidity (`.sol`) contract.
*   **Token Standards**: ERC-20, ERC-721 (NFTs), ERC-1155.
*   **Logic**: Loops, mappings, structs, events, require/revert logic.
*   **Precompiles**: Access to native elliptic curve operations (ecrecover, sha256).

### Client Libraries (e.g., ethers.js)
What you can do in Node.js/Frontend:
```javascript
// Connect
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:9944");

// Read
const balance = await provider.getBalance("0x...");
const contract = new ethers.Contract(addr, abi, provider);
const data = await contract.myViewFunction(); // Uses eth_call

// Write
const wallet = new ethers.Wallet(privateKey, provider);
const tx = await contract.connect(wallet).myWriteFunction(arg1);
await tx.wait(); // Wait for block inclusion
```

---

## 2. Substrate Pallet Capabilities (Native)
Under the hood, your chain is built on Substrate. It has "Pallets" (modules) that provide features beyond just the EVM. These are accessed via the **Substrate RPC** (Port `9944`) using Polkadot.js.

### Installed Pallets & Features

| Pallet | Functionality |
| :--- | :--- |
| **pallet_evm** | The execution engine for smart contracts. Stores account codes and storage. |
| **pallet_ethereum** | Stores Ethereum blocks, transaction receipts, and handles RPC mappings. |
| **pallet_balances** | Manages the native currency. This *is* the ETH balance you see in Metamask. |
| **pallet_sidechain** | **Cardano Integration Core**. Handles mainchain block headers, epoch transitions, and candidate selection. |
| **pallet_session_validator_management** | Manages the dynamic committee of validators (permissioned/permissionless). |
| **pallet_partner_chains_bridge** | **Bridging**. Allows moving assets/messages between Cardano and this chain. |
| **pallet_governed_map** | A governance storage key-value map for chain configuration. |
| **pallet_block_producer_fees** | fee distribution logic for block producers. |
| **pallet_sudo** | Root-level administration (Superuser). Can force-set storage or upgrade runtime. |

### Unique Capabilities
*   **Cross-Chain Bridging**: You can potentially bridge assets from Cardano (ADA/Native Assets) to this chain.
*   **Committee Management**: The validator set is not static; it rotates based on Cardano-side registration (mocked currently, but designed for real SPOs).
*   **Runtime Upgrades**: You can upgrade the chain logic *without* a hard fork (using WASM).
*   **Governance**: You can use `GovernedMap` to change parameters via committee vote.

---

## 3. Workflow Summary

1.  **Developer Flow (EVM)**:
    *   Write Solidity -> Compile -> Deploy (Remix/Hardhat) -> Interact (ethers.js).
    *   *Tools*: Metamask, Remix, BlockScout.

2.  **Operator Flow (Substrate)**:
    *   Monitor usage, check block production, manage validators.
    *   *Tools*: Polkadot.js Apps, Telemetry.

3.  **Cross-Chain Flow (Partner Chain)**:
    *   Register SPO on Cardano -> become Validator on Partner Chain.
    *   Bridge Tokens -> Use in EVM Contracts.

This hybrid architecture gives you the **rich ecosystem of Ethereum** (contracts, tools) backed by the **security and decentralized validator set of Cardano/Substrate**.
