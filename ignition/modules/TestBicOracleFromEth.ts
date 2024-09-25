import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import {entryPointAddress} from "./constant";

const TestBicOracleFromEth = buildModule('TestBicOracleFromEth', (m) => {
    const testBicOracleFromTokenToEth = m.contract('TestBicOracleFromEth', [
        "0x66f6099454f7b3bf06994943e4f5203a279bb9a6", // baseToken
        "0xAA84765a5fDE01FDC84519eF13C9aC3b6D47E26F", // quoteToken
        "0x0f55e0cadb0afda75d81140f93dcfc48c019abf3", // pool
        60, // period
    ]);
    return {testBicOracleFromTokenToEth};
});
export default TestBicOracleFromEth;
