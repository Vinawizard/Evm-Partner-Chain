# 🔮 India Chain EVM Guide

This document explains the Ethereum Virtual Machine (EVM) layer of the India Chain, how to interact with it, and technical specifications.

## 1. Metadata & Specifications

*   **Network Name**: India Chain Local
*   **Chain ID**: `1337` (Hex: `0x539`)
*   **RPC URL**: `http://127.0.0.1:9944`
*   **Currency**: `TEST` (18 decimals)
*   **Block Time**: ~6 seconds (Aura consensus simulation)

## 2. Connecting Wallets

### MetaMask
1.  **Add Network Manually**.
2.  **RPC URL**: `http://127.0.0.1:9944`.
3.  **Chain ID**: `1337`.
4.  **Import Account**: Use one of the pre-funded keys from [CREDENTIALS.md](./CREDENTIALS.md).

## 3. Deploying Contracts

### Method A: Remix IDE (GUI)
1.  Go to [Remix](https://remix.ethereum.org).
2.  Create your `.sol` file.
3.  **Environment**: "External Http Provider" (`http://127.0.0.1:9944`).
4.  **Deploy**: Click the orange button.

### Method B: Foundry (CLI)
Using `cast` to deploy compiled bytecode:

```bash
# 1. Export Key
export KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 2. Deploy
cast send --rpc-url http://127.0.0.1:9944 --private-key $KEY --create <BYTECODE_HEX>
```

## 4. JSON Metadata & Storage

The EVM layer allows storing arbitrary data. We use this for our "SimpleRecord" demo.

### Storing JSON
Solidity doesn't essentially "know" JSON, it just treats it as a `string`.
```solidity
function setRecord(string memory _data) public ...
```
**Input Example:**
```json
{
  "name": "Farmer-1",
  "crop": "Wheat",
  "location": "Punjab-Sector-4"
}
```
**On-Chain representation**: The string is hex-encoded and stored in the contract's storage slot.

### Retrieving JSON via RPC
You can read the data back using `eth_call`:

**Request:**
```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"<CONTRACT_ADDR>","data":"<SELECTOR>"}, "latest"],"id":1}' http://127.0.0.1:9944
```

**Response:**
You will get a hex string. Decode it to see your JSON.
```bash
cast --to-ascii <HEX_OUTPUT>
# Output: {"name": "Farmer-1", ...}
```

## 5. Supported Standards
*   **ERC-20**: Fully supported (Tokens).
*   **ERC-721**: Fully supported (NFTs/Land Titles).
*   **EIP-1559**: Transaction types supported.
