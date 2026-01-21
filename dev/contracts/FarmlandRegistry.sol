// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FarmlandRegistry {
    // Event to allow indexers (The Graph) to track new farms
    event FarmRegistered(string indexed farmId, string jsonData, uint256 timestamp);

    struct FarmData {
        string id;
        string jsonData;
        uint256 registeredAt;
    }

    // Storage: Maps "FARM-001" -> FarmData
    mapping(string => FarmData) public farms;
    string[] public farmIds;

    // Register or Update a Farm
    function registerFarm(string memory _farmId, string memory _jsonData) public {
        farms[_farmId] = FarmData({
            id: _farmId,
            jsonData: _jsonData,
            registeredAt: block.timestamp
        });
        
        farmIds.push(_farmId);
        
        emit FarmRegistered(_farmId, _jsonData, block.timestamp);
    }

    // Retrieve Data
    function getFarm(string memory _farmId) public view returns (string memory, uint256) {
        return (farms[_farmId].jsonData, farms[_farmId].registeredAt);
    }

    // Get Total Count
    function getTotalFarms() public view returns (uint256) {
        return farmIds.length;
    }
}
