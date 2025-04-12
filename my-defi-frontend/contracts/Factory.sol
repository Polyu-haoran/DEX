// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Pair.sol";

contract Factory {
    mapping(address => mapping(address => address)) public pairs;
    address[] public allPairs;

    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair
    );

    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair) {
        require(tokenA != tokenB, "Identical tokens");
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "Zero address");
        require(pairs[token0][token1] == address(0), "Pair exists");

        pair = address(new Pair(token0, token1));

        pairs[token0][token1] = pair;
        pairs[token1][token0] = pair;
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair);
    }
}
