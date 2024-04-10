import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import UniswapV3Factory from "./UniswapV3Factory";
import TestWeth9 from "./TestWeth9";

const SwapRouter = buildModule("SwapRouter", (m) => {
    const {factory} = m.useModule(UniswapV3Factory);
    const {testWeth9} = m.useModule(TestWeth9);

  const swapRouter = m.contract("SwapRouter", [factory, testWeth9]);
  return {swapRouter};
});

export default SwapRouter;
