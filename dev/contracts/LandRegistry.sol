// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title LandRegistry
 * @dev A simple land registry contract for the Cardano-EVM Partner Chain
 */
contract LandRegistry {
    struct Land {
        string location;
        uint256 area;        // in square meters
        address owner;
        uint256 price;       // in wei
        bool isForSale;
        uint256 registeredAt;
    }

    mapping(uint256 => Land) public lands;
    mapping(address => uint256[]) public ownerLands;
    uint256 public landCount;
    address public registrar;

    event LandRegistered(uint256 indexed landId, string location, address owner);
    event LandTransferred(uint256 indexed landId, address from, address to);
    event LandListedForSale(uint256 indexed landId, uint256 price);
    event LandSold(uint256 indexed landId, address from, address to, uint256 price);

    constructor() {
        registrar = msg.sender;
        landCount = 0;
    }

    modifier onlyRegistrar() {
        require(msg.sender == registrar, "Only registrar can perform this action");
        _;
    }

    modifier onlyOwner(uint256 _landId) {
        require(lands[_landId].owner == msg.sender, "Only land owner can perform this action");
        _;
    }

    /**
     * @dev Register a new piece of land
     */
    function registerLand(
        string memory _location,
        uint256 _area,
        address _owner
    ) public onlyRegistrar returns (uint256) {
        landCount++;
        
        lands[landCount] = Land({
            location: _location,
            area: _area,
            owner: _owner,
            price: 0,
            isForSale: false,
            registeredAt: block.timestamp
        });
        
        ownerLands[_owner].push(landCount);
        
        emit LandRegistered(landCount, _location, _owner);
        return landCount;
    }

    /**
     * @dev Get land details
     */
    function getLand(uint256 _landId) public view returns (
        string memory location,
        uint256 area,
        address owner,
        uint256 price,
        bool isForSale,
        uint256 registeredAt
    ) {
        Land memory land = lands[_landId];
        return (
            land.location,
            land.area,
            land.owner,
            land.price,
            land.isForSale,
            land.registeredAt
        );
    }

    /**
     * @dev List land for sale
     */
    function listForSale(uint256 _landId, uint256 _price) public onlyOwner(_landId) {
        require(_price > 0, "Price must be greater than 0");
        lands[_landId].price = _price;
        lands[_landId].isForSale = true;
        emit LandListedForSale(_landId, _price);
    }

    /**
     * @dev Buy land that is for sale
     */
    function buyLand(uint256 _landId) public payable {
        Land storage land = lands[_landId];
        require(land.isForSale, "Land is not for sale");
        require(msg.value >= land.price, "Insufficient payment");
        
        address previousOwner = land.owner;
        
        // Transfer ownership
        land.owner = msg.sender;
        land.isForSale = false;
        land.price = 0;
        
        // Update ownership records
        ownerLands[msg.sender].push(_landId);
        
        // Pay previous owner
        payable(previousOwner).transfer(msg.value);
        
        emit LandSold(_landId, previousOwner, msg.sender, msg.value);
    }

    /**
     * @dev Get number of lands owned by an address
     */
    function getLandsCount(address _owner) public view returns (uint256) {
        return ownerLands[_owner].length;
    }

    /**
     * @dev Transfer registrar role
     */
    function transferRegistrar(address _newRegistrar) public onlyRegistrar {
        registrar = _newRegistrar;
    }
}
