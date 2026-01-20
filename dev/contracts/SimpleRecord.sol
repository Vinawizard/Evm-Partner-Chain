// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleRecord
 * @dev Stores a simple string record (perfect for JSON data) on the blockchain.
 */
contract SimpleRecord {
    // This variable stores the data permanently on the blockchain
    string public record;

    event RecordUpdated(address indexed user, string newData);

    /**
     * @dev Save a string (like JSON) to the blockchain.
     * @param _data The string to store.
     */
    function setRecord(string memory _data) public {
        record = _data;
        emit RecordUpdated(msg.sender, _data);
    }

    /**
     * @dev Read the stored data.
     */
    function getRecord() public view returns (string memory) {
        return record;
    }
}
