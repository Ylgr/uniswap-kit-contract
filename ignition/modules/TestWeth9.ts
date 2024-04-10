import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";

const TestWeth9 = buildModule("TestWeth9", (m) => {
  const testWeth9 = m.contract("TestWeth9");
  return {testWeth9};
});

export default TestWeth9;
