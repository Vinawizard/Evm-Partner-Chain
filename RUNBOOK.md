# 📘 India Chain Runbook

This runbook details how to operate, maintain, and troubleshoot the India Chain (Cardano EVM Partner Chain) node.

## 1. Node Operations

### Starting the Node
The node binary is located at `./target/release/partner-chains-demo-node`.

**Development Mode (Reset state on exit):**
```bash
./target/release/partner-chains-demo-node --dev
```

**Persistent Mode (Keep data):**
```bash
./target/release/partner-chains-demo-node --dev --base-path ./data
```

### Stopping the Node
A graceful shutdown ensures database integrity.
```bash
# Find the process ID
pgrep -f partner-chains-demo-node

# Kill it gracefully (SIGTERM)
pkill -f partner-chains-demo-node
```

## 2. verifying Health

### Check Logs
Watch the terminal output for:
*   `Breeding block`: Indicates block production is active.
*   `best: #N`: Current block height.
*   `finalized #N`: Finalized block height.

### Check RPC Connection
```bash
curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "eth_chainId"}' http://127.0.0.1:9944
# Result: "0x539" (1337)
```

## 3. Deployment Workflow

### Prerequisites
*   `rust` & `cargo` confirmed installed.
*   `node` built successfully (`cargo build --release -p partner-chains-demo-node`).

### Deploying Smart Contracts
See [EVM.md](./EVM.md) for detailed deployment instructions using Foundry or Remix.

## 4. Troubleshooting

**Issue: "Verification Error: Future block"**
*   **Cause**: System clock drift or heavy lag.
*   **Fix**: Restart the node. In dev mode, this resets the chain.

**Issue: "Transaction Reverted" without reason**
*   **Cause**: Gas limit too low or logic error.
*   **Fix**: detailed RPC error logging is enabled. Check node logs for `evm` debug traces.

## 5. Maintenance
*   **Data Cleanup**: `rm -rf ./data` (for persistent mode).
*   **Update Runtime**: Recompile with `cargo build --release -p partner-chains-demo-runtime`.
