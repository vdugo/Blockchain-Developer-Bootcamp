// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import 'hardhat/console.sol';

import './Token.sol';

contract Exchange
{
    address public feeAccount;
    uint256 public feePercent;

    // keep track of how many tokens users have deposited
    // top level is indexed by token
    mapping(address => mapping(address => uint256)) public tokens;

    event Deposit(address _token, address _user, uint256 _amount, uint256 _balance);

    event Withdraw(address _token, address _user, uint256 _amount, uint256 _balance);

    constructor(address _feeAccount, uint256 _feePercent)
    {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }
    // Deposit Tokens
    function depositToken(address _token, uint256 _amount) public
    {
        // Transfers tokens to exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        // Update user balance
        tokens[_token][msg.sender] += _amount;
        // Emit an event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // Withdraw Tokens
    function withdrawToken(address _token, uint256 _amount) public
    {

        // Ensure user has enough tokens to withdraw
        require(tokens[_token][msg.sender] >= _amount);
        // Update user balance
        Token(_token).transfer(msg.sender, _amount);
        // Transfer tokens to user
        tokens[_token][msg.sender] -= _amount;
        // Emit event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // Check Balances

    function balanceOf(address _token, address _user) public view returns(uint256)
    {
        return tokens[_token][_user];
    }
}
