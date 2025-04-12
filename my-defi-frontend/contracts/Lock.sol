// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Lock {
    struct LockInfo {
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => LockInfo) public locks;
    IERC20 public token;

    event Locked(address indexed user, uint256 amount, uint256 unlockTime);
    event Unlocked(address indexed user, uint256 amount);

    constructor(address _token) {
        token = IERC20(_token);
    }

    function lock(uint256 amount, uint256 duration) external {
        require(amount > 0, "Amount must be positive");
        require(duration > 0, "Duration must be positive");
        require(locks[msg.sender].amount == 0, "Already locked");

        uint256 unlockTime = block.timestamp + duration;
        locks[msg.sender] = LockInfo(amount, unlockTime);

        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        emit Locked(msg.sender, amount, unlockTime);
    }

    function unlock() external {
        LockInfo memory lockInfo = locks[msg.sender];
        require(lockInfo.amount > 0, "No locked tokens");
        require(block.timestamp >= lockInfo.unlockTime, "Still locked");

        uint256 amount = lockInfo.amount;
        delete locks[msg.sender];

        require(token.transfer(msg.sender, amount), "Transfer failed");

        emit Unlocked(msg.sender, amount);
    }
}
