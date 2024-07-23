import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FakeTether = buildModule("FakeTether", (m) => {
    const fakeTether = m.contract("TestERC20");
    return { fakeTether };
});
export default FakeTether;
