# Cardano EVM Partner Chain: India Chain Demo

> **Note**: This repository contains a customized Substrate-based Partner Chain node with full EVM compatibility.

## 📚 Documentation Index

Start here to understand what has been built and how to use it.

1.  **[CAPABILITIES.md](./CAPABILITIES.md)**: 🚀 What can you do with this chain? (DeFi, Supply Chain, smart contracts).
2.  **[BUILD_SUMMARY.md](./BUILD_SUMMARY.md)**: 🛠 Technical details of the `lib.rs` and `Cargo.toml` modifications.
3.  **[RUNBOOK.md](./RUNBOOK.md)**: 📘 How to start, stop, and maintain the node.
4.  **[CREDENTIALS.md](./CREDENTIALS.md)**: 🔑 Pre-funded private keys for testing (10 Billion tokens).
5.  **[EVM.md](./EVM.md)**: 🔮 Detailed EVM guide (RPC, Metadata, Deployment).
6.  **[USER_GUIDE.md](./USER_GUIDE.md)**: 🧑‍🏫 Step-by-step specific guide for **MetaMask** and **Remix**.

## ⚡ Quick Start

### 1. Build
```bash
cargo build --release -p partner-chains-demo-node
```

### 2. Run
```bash
./target/release/partner-chains-demo-node --dev
```

### 3. Connect (MetaMask)
*   **RPC**: `http://127.0.0.1:9944`
*   **Chain ID**: `1337`

## 📊 Dashboard
We have included a local dashboard to visualize the Land Registry demo.
Open `dev/india-dashboard.html` in your browser.
