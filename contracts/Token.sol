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
    
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply)
    {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10**decimals); // _totalSupply * 10^18
        // update the balance of the person deploying the smart contract
        // to the entire totalSupply of the tokens that we specified
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns(bool success)
    {
        // Deduct tokens from spender
        balanceOf[msg.sender] -= _value;
        // Credit tokens to receiver
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);

        return true;
    }
}
