// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token
{
    string public name; 
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // Track Balances
    mapping(address => uint256) public balanceOf;
    // Send Tokens

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply)
    {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10**decimals); // _totalSupply * 10^18
        // update the balance of the person deploying the smart contract
        // to the entire totalSupply of the tokens that we specified
        balanceOf[msg.sender] = totalSupply;
    }
}
