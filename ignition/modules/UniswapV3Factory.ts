import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UniswapV3Factory = buildModule("UniswapV3Factory", (m) => {
  const factory = m.contract("UniswapV3Factory");
  return { factory };
});

export default UniswapV3Factory;
