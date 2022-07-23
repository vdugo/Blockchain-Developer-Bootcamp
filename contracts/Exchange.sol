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

    mapping(uint256 => _Order) public orders;
    uint256 public ordersCount;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

    event Deposit(address _token, address _user, uint256 _amount, uint256 _balance);

    event Withdraw(address _token, address _user, uint256 _amount, uint256 _balance);

    event Order
    (
        uint256 _id,
        address _user,
        address _tokenGet, 
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive,
        uint256 _timestamp
    );

    event Cancel
    (
        uint256 _id,
        address _user,
        address _tokenGet, 
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive,
        uint256 _timestamp
    );

    event Trade
    (
        uint256 _id,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive,
        address _creator,
        uint256 _timestamp
    );

    struct _Order
    {
        uint256 id; // unique identifier for order
        address user; // user who made the order

        address tokenGet; // address of token they receive
        uint256 amountGet; // amount they receive
        address tokenGive; // address of token they give
        uint256 amountGive; // amount they give

        uint256 timestamp; // when order was created
    }

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




    // -----------------------------
    // -----------------------------
    // -----------------------------
    // MAKE AND CANCEL ORDERS



    // Token Give (the token they want to spend) - which token, and how much?
    // Token Get (the token they want to receive) - which token, and how much?
    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public
    {
        // Prevent orders if tokens aren't on the exchange
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

        //struct _Order
        //uint256 id; // unique identifier for order
        //address user; // user who made the order
        //address tokenGet; // address of token they receive
        //uint256 amountGet; // amount they receive
        //address tokenGive; // address of token they give
        //uint256 amountGive; // amount they give
        //uint256 timestamp; // when order was created, Unix timestamp in seconds starting from Jan 1, 1970

        // instantiate a new order
        ordersCount += 1;
        orders[ordersCount] = 
        _Order
        (
            ordersCount, // id, 1, 2, 3
            msg.sender, // user '0x...abc123'
            _tokenGet, 
            _amountGet, 
            _tokenGive, 
            _amountGive, 
            block.timestamp // Unix timestamp 1893507958
        );

        // Emit event
        emit Order
        (
            ordersCount, // id, 1, 2, 3
            msg.sender, // user '0x...abc123'
            _tokenGet, 
            _amountGet, 
            _tokenGive, 
            _amountGive, 
            block.timestamp // Unix timestamp 1893507958
        );
    } 

    function cancelOrder(uint256 _id) public
    {
        // Fetch the order
        _Order storage _order = orders[_id];

        // Cancel the order
        orderCancelled[_id] = true;

        // Ensure the caller of the function is the owner of the order
        require(_order.user == msg.sender);

        // Order must exist
        require(_order.id == _id);
    
        // Emit event
        emit Cancel
        (
            _order.id, 
            msg.sender, 
            _order.tokenGet, 
            _order.amountGet, 
            _order.tokenGive, 
            _order.amountGive, 
            block.timestamp
        );
    }



    // -----------------------------
    // -----------------------------
    // -----------------------------
    // EXECUTING ORDERS



    function fillOrder(uint256 _id) public 
    {
        // 1. Must be valid orderId
        require(_id > 0 && _id <= ordersCount, "Order does not exist");
        // 2. Order can't be filled
        require(!orderFilled[_id]);
        // 3. Order can't be cancelled
        require(!orderCancelled[_id]);

        // Fetch order
        _Order storage _order = orders[_id];

        // Swapping tokens (trading)
        _trade
        (
            _order.id, 
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive
        );

        // Mark order as filled
        orderFilled[_order.id] = true;
    }

    function _trade
    (
        uint256 _orderId,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) 
        internal
    {
        // Fee is paid by the taker (user who filled the order aka msg.sender in this case)
        // Fee is deducted from _amountGet
        uint256 _feeAmount = (_amountGet * feePercent) / 100;

        // Do trade here
        // _amountGet and _amountGive refer to the maker
        // msg.sender is the taker, the person filling the order.
        // so we have to do the opposite of what we do for the maker
        tokens[_tokenGet][msg.sender] -= (_amountGet + _feeAmount); // taker pays the fee
        tokens[_tokenGive][msg.sender] += _amountGive;

        // Charge the fees
        tokens[_tokenGet][feeAccount] += _feeAmount;

        // _user is the maker
        tokens[_tokenGet][_user] += _amountGet;
        tokens[_tokenGive][_user] -= _amountGive;

        // Emit Trade event
        emit Trade
        (
        _orderId,
        msg.sender,
        _tokenGet,
        _amountGet,
        _tokenGive,
        _amountGive,
        _user,
        block.timestamp
        );
    }

}
