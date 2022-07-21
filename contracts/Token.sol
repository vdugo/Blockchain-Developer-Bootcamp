// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token
{
    string public name = "Dapp University";
    string public symbol = "DAPP";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * (10**decimals); // 1,000,000 * 10^18
}
