import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import UniswapV3Factory from "./UniswapV3Factory";
import TestWeth9 from "./TestWeth9";

const QuoterV2 = buildModule("QuoterV2", (m) => {
    const {factory} = m.useModule(UniswapV3Factory);
    const {testWeth9} = m.useModule(TestWeth9);

    const quoterV2 = m.contract("QuoterV2", [factory, testWeth9]);
    return { quoterV2 };
});
export default QuoterV2;
