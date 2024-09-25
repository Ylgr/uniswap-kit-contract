// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.6 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";

contract TestBicOracleFromEth is Ownable {
    address public baseToken;
    address public quoteToken;
    address public pool;
    uint32 public period;

    constructor(address _baseToken, address _quoteToken, address _pool, uint32 _period) {
        baseToken = _baseToken;
        quoteToken = _quoteToken;
        pool = _pool;
        period = _period;
    }

    function setup(address _baseToken, address _quoteToken, address _pool, uint32 _period) external onlyOwner {
        baseToken = _baseToken;
        quoteToken = _quoteToken;
        pool = _pool;
        period = _period;
    }

    function getQuoteAmount(uint128 baseAmount) public view returns (uint256) {
        uint32[] memory _secondsAgos = new uint32[](2);
        _secondsAgos[0] = period;
        _secondsAgos[1] = 0;

        (int56[] memory _tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s) = IUniswapV3Pool(pool).observe(_secondsAgos);

        int56 _tickCumulativesDelta = _tickCumulatives[1] - _tickCumulatives[0];
        int24 _arithmeticMeanTick = int24(_tickCumulativesDelta / period);
        // Always round to negative infinity
        if (_tickCumulativesDelta < 0 && (_tickCumulativesDelta % period != 0)) _arithmeticMeanTick--;

        return OracleLibrary.getQuoteAtTick(_arithmeticMeanTick, baseAmount, baseToken, quoteToken);

    }

    function getTokenValueOfEth(uint256 ethOutput) external view returns (uint256 tokenInput) {
        uint256 quoteAmount = getQuoteAmount(1e8);
        return ethOutput * 1e8 / quoteAmount;
    }
}
