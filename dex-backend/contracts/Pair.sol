// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Pair {
    address public immutable tokenA;
    address public immutable tokenB;
    uint256 public reserveA;
    uint256 public reserveB;

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB);
    event SwapAForB(address indexed user, uint256 amountAIn, uint256 amountBOut);
    event SwapBForA(address indexed user, uint256 amountBIn, uint256 amountAOut);

    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token address");
        require(_tokenA != _tokenB, "Same token address");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "Amount must be positive");
        
        if (reserveA == 0 && reserveB == 0) {
            reserveA = amountA;
            reserveB = amountB;
        } else {
            // 检查添加比例是否匹配
            require(
                reserveA * amountB == reserveB * amountA,
                "Invalid liquidity ratio"
            );
            reserveA += amountA;
            reserveB += amountB;
        }

        require(
            ERC20(tokenA).transferFrom(msg.sender, address(this), amountA),
            "Transfer A failed"
        );
        require(
            ERC20(tokenB).transferFrom(msg.sender, address(this), amountB),
            "Transfer B failed"
        );
        emit LiquidityAdded(msg.sender, amountA, amountB);
    }

    function swapAForB(uint256 amountAIn) external {
        require(amountAIn > 0, "Amount must be positive");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        
        uint256 amountBOut = (reserveB * amountAIn) / (reserveA + amountAIn);
        require(amountBOut > 0, "Insufficient output");
        
        require(
            ERC20(tokenA).transferFrom(msg.sender, address(this), amountAIn),
            "Transfer A failed"
        );
        require(
            ERC20(tokenB).transfer(msg.sender, amountBOut),
            "Transfer B failed"
        );
        
        reserveA += amountAIn;
        reserveB -= amountBOut;
        emit SwapAForB(msg.sender, amountAIn, amountBOut);
    }

    function swapBForA(uint256 amountBIn) external {
        require(amountBIn > 0, "Amount must be positive");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        
        uint256 amountAOut = (reserveA * amountBIn) / (reserveB + amountBIn);
        require(amountAOut > 0, "Insufficient output");
        
        require(
            ERC20(tokenB).transferFrom(msg.sender, address(this), amountBIn),
            "Transfer B failed"
        );
        require(
            ERC20(tokenA).transfer(msg.sender, amountAOut),
            "Transfer A failed"
        );
        
        reserveB += amountBIn;
        reserveA -= amountAOut;
        emit SwapBForA(msg.sender, amountBIn, amountAOut);
    }

    function getPrice(address fromToken) public view returns (uint256) {
        require(fromToken == tokenA || fromToken == tokenB, "Invalid token");
        require(reserveA > 0 && reserveB > 0, "No liquidity");
        
        return (fromToken == tokenA) ? 
            (reserveB * 1e18) / reserveA : 
            (reserveA * 1e18) / reserveB;
    }
}