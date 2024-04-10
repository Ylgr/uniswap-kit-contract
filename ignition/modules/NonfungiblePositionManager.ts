import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import TestWeth9 from "./TestWeth9";
import UniswapV3Factory from "./UniswapV3Factory";

const NonfungiblePositionManager = buildModule("NonfungiblePositionManager", (m) => {
    const nftDescriptor = m.library("NFTDescriptor");

    const {testWeth9} = m.useModule(TestWeth9);
    const {factory} = m.useModule(UniswapV3Factory);

    const nonfungibleTokenPositionDescriptor = m.contract(
        "NonfungibleTokenPositionDescriptor",
        [testWeth9, '0x4554480000000000000000000000000000000000000000000000000000000000'],
        {
            libraries: {
                NFTDescriptor: nftDescriptor,
            },
    });


    const nonfungiblePositionManager = m.contract(
        "NonfungiblePositionManager",
        [factory, testWeth9, nonfungibleTokenPositionDescriptor]
    );
    return { nonfungiblePositionManager };
});

export default NonfungiblePositionManager;
