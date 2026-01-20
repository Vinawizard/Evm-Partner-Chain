# User Guide: storing "Farmer-1-Woods" JSON on India Chain

This guide will help you connect your MetaMask wallet, view your 10 Billion token balance, and deploy a simple contract to store your data.

---

## Part 1: Connect MetaMask

1.  **Open MetaMask** and click the network selector (top-left).
2.  Click **Add Network** -> **Add a network manually**.
3.  Enter these details:
    *   **Network Name**: India Chain Local
    *   **RPC URL**: `http://127.0.0.1:9944`
    *   **Chain ID**: `1337`
    *   **Currency Symbol**: `TEST`
4.  Click **Save**.
5.  **Import Account**:
    *   Click the account circle icon (top-right) -> **Import Account**.
    *   Paste this Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
    *   Click **Import**.
    *   🎉 You should see **10,000,000,000 TEST** tokens.

---

## Part 2: Prepare the Contract in Remix

1.  Open **[Remix IDE](https://remix.ethereum.org)**.
2.  In the File Explorer (left), click **Create New File** and name it `SimpleRecord.sol`.
3.  Copy and paste this code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleRecord {
    string public record;

    function setRecord(string memory _data) public {
        record = _data;
    }
}
```

4.  Click the **Solidity Compiler** tab (3rd icon on left) and click the blue **Compile SimpleRecord.sol** button.

---

## Part 3: Deploy & Store Data

1.  Click the **Deploy & Run Transactions** tab (4th icon on left).
2.  **Environment**: Select **Injected Provider - MetaMask**.
    *   *MetaMask will pop up asking to connect. Click Confirm.*
3.  **Account**: Verify it shows your imported account (starting with `0xf39...`).
4.  **Contract**: Select `SimpleRecord`.
5.  Click the orange **Deploy** button.
    *   *MetaMask will pop up. Click **Confirm** to pay the gas.*
    *   Wait for the green checkmark in the console.

---

## Part 4: Save "Farmer-1-Woods"

1.  In Remix, look under **Deployed Contracts** (bottom left). You should see `SimpleRecord`. Expand it >.
2.  Locate the `setRecord` input box.
3.  Paste your JSON data inside quotes:
    ```
    "{\"name\": \"Farmer-1\", \"type\": \"Woods\"}"
    ```
    *Or just a simple string:*
    ```
    "Farmer-1-Woods"
    ```
4.  Click the **transact** button (orange).
    *   *MetaMask will pop up. Click **Confirm**.*
5.  Once confirmed, click the blue **record** button.
6.  👇 You will see your data printed below the button!

---

**Troubleshooting:**
*   **"System Busy" / "Internal Error"?** Reset your MetaMask account nonce: Settings -> Advanced -> Clear Activity Tab Data.
