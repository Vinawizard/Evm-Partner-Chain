# Cryptography & Hashing Guide

This document explains the cryptographic concepts used in this Partner Chain project, specifically how **Private Keys**, **Addresses**, and **contract data** are related.

---

## 1. The Keypair Chain
Everything starts with your Private Key. This is the **only** secret. Everything else is mathematically derived from it.

### A. Private Key (`H256`)
*   **What is it?**: A random 256-bit number (32 bytes).
*   **Example**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` (Standard Dev Key)
*   **Role**: Signs transactions. Proves ownership. Never shared.

### B. Public Key
*   **Derivation**: Elliptic Curve Digital Signature Algorithm (ECDSA) using the **secp256k1** curve.
*   **Math**: `Public Key = Private Key * G` (where G is a generator point).
*   **Role**: Allows others to verify your signature without seeing your private key.

### C. Address (`H160`)
*   **What is it?**: Your public identity on the blockchain.
*   **Derivation**:
    1.  Take the Public Key.
    2.  Hash it using **Keccak-256**.
    3.  Take the **last 20 bytes** (160 bits).
    4.  Prefix with `0x`.
*   **Example**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

> **Note**: An address is just a "hash" of your public key. You cannot go backwards from Address -> Private Key.

---

## 2. Common Data Types explained

### `H160` (Hash-160)
*   **Size**: 20 Bytes (40 hex characters)
*   **Usage**: **Addresses** (User wallets, Contract addresses).
*   **Why?**: Compact identifier for accounts.

### `H256` (Hash-256)
*   **Size**: 32 Bytes (64 hex characters)
*   **Usage**:
    *   **Transaction Hashes** (IDs).
    *   **Block Hashes**.
    *   **Storage Keys** (Slot locations in the database).
    *   **Private Keys**.

### `U256` (Unsigned Integer 256)
*   **Size**: 256-bit Number.
*   **Usage**: **Values** (Token balances, Prices, Nonces).
*   **Why?**: EVM word size is 256 bits to support large numbers and cryptographic math efficiently.

---

## 3. How Contract Addresses are Created
When you deployed `FarmlandRegistry.sol`, the address `0x5Fb...` wasn't random. It was calculated:

`Contract Address = Keccak256(RLP_Encode(Deployer_Address, Nonce))`

*   **Deployer**: `0xf39F...2266`
*   **Nonce**: `0` (First transaction from this account)
*   **Result**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

This is why re-deploying on a fresh node (where nonce resets to 0) gives the **same contract address**.

---

## 4. Contract Storage & Maps
In our `view-farms.js`, we successfully decoded data. Here is how the EVM found that data using hashes.

**The Mapping in Solidity:**
```solidity
mapping(string => FarmData) public farms;
```

**Finding the Data:**
To find the data for key `"FARM-101"`, the EVM calculates a **Storage Slot Hash**:

`Slot Hash = Keccak256( Key_Value + Mapping_Slot_Index )`

1.  **Key**: `"FARM-101"` (converted to hex)
2.  **Slot**: `0` (Position of `farms` variable in the file)
3.  **Hash**: Results in a massive 64-character hex string (e.g., `0x3688...`).

The EVM then looks up this **Hash** in its database to find the farmer's name.

---

## Summary Cheat Sheet

| Term | Cryptography | Purpose |
| :--- | :--- | :--- |
| **Private Key** | Random 32 bytes | **Signing** & Control |
| **Public Key** | ECDSA (secp256k1) | Verification |
| **Address** | Keccak-256 (Last 20 bytes) | **Identity** / Routing |
| **Tx Hash** | Keccak-256 of Tx Data | Unique Receipt ID |
| **Storage Slot** | Keccak-256 of Key+Position | Database Lookup Key |

This web of hashes ensures that:
1.  Only **you** can move your funds (Private Key).
2.  Contracts are deployed deterministically.
3.  Data is stored collision-free in the massive EVM storage space.
