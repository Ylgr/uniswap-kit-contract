import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import UniswapV3Factory from "./UniswapV3Factory";

const StaticOracle = buildModule("StaticOracle", (m) => {
    const {factory} = m.useModule(UniswapV3Factory);
    const CARDINALITY_PER_MINUTE = 60;
    const staticOracle = m.contract("StaticOracle", [factory, CARDINALITY_PER_MINUTE]);
    return {staticOracle};
});
export default StaticOracle;
