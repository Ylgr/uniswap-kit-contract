// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.6;

interface IOracle {

    /**
     * return amount of tokens that are required to receive that much eth.
     */
    function getTokenValueOfEth(uint256 ethOutput) external view returns (uint256 tokenInput);
}
