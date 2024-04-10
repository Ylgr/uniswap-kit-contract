import {ethers, run} from 'hardhat';
import DeployedAddress from '../ignition/deployments/chain-421614/deployed_addresses.json';
import bn from "bignumber.js";

enum FeeAmount {
    LOW = 500,
    MEDIUM = 3000,
    HIGH = 10000,
}

function encodePriceSqrt(reserve1: string, reserve0: string): BigInt {
    return BigInt(
        new bn(reserve1)
            .div(reserve0)
            .sqrt()
            .multipliedBy(new bn(2).pow(96))
            .integerValue(3)
            .toString()
    )
}

function compareToken(a: { target: string }, b: { target: string }): -1 | 1 {
    return a.target.toLowerCase() < b.target.toLowerCase() ? -1 : 1
}

function sortedTokens(
    a: { target: string },
    b: { target: string }
): [typeof a, typeof b] | [typeof b, typeof a] {
    return compareToken(a, b) < 0 ? [a, b] : [b, a]
}


const getMinTick = (tickSpacing: number) => Math.ceil(-887272 / tickSpacing) * tickSpacing
const getMaxTick = (tickSpacing: number) => Math.floor(887272 / tickSpacing) * tickSpacing

const main = async () => {
    // const TestERC20 = await ethers.getContractFactory('TestERC20');
    // const testERC20 = await TestERC20.deploy();
    // await run("verify:verify", {
    //     address: testERC20.target.toString(),
    //     constructorArguments: [],
    // });
    // const ThisIsFineToken = await ethers.getContractFactory('ThisIsFineToken');
    // const thisIsFineToken = await ThisIsFineToken.deploy();
    // await run("verify:verify", {
    //     address: thisIsFineToken.target.toString(),
    //     constructorArguments: [],
    // });

    const testERC20 = await ethers.getContractAt('TestERC20', '0x2ab4Cd18057C7a3df47902cD5F28E628A00f17E0');
    const thisIsFineToken = await ethers.getContractAt('ThisIsFineToken', '0x3c00AFe38b1Db109A0f740368063Db1608E0bb77');
    const [token0, token1] = sortedTokens(testERC20 as { target: string }, thisIsFineToken as { target: string });

    const nonfungiblePositionManagerAddress = DeployedAddress["NonfungiblePositionManager#NonfungiblePositionManager"];
    const nonfungiblePositionManager = await ethers.getContractAt('NonfungiblePositionManager', nonfungiblePositionManagerAddress);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    // await token0.approve(nonfungiblePositionManagerAddress, ethers.parseEther("100000"));
    // await token1.approve(nonfungiblePositionManagerAddress, ethers.parseEther("100000"));

    await nonfungiblePositionManager.multicall([
        nonfungiblePositionManager.interface.encodeFunctionData('createAndInitializePoolIfNecessary', [
            token0.target as string, token1.target as string, FeeAmount.MEDIUM, encodePriceSqrt('1', '3')
        ]),
        nonfungiblePositionManager.interface.encodeFunctionData('mint', [{
            token0: token0.address,
            token1: token1.address,
            fee: FeeAmount.MEDIUM,
            tickLower: getMinTick(FeeAmount.MEDIUM),
            tickUpper: getMaxTick(FeeAmount.MEDIUM),
            amount0Desired: ethers.parseEther("100000"),
            amount1Desired: ethers.parseEther("100000"),
            amount0Min: 0,
            amount1Min: 0,
            recipient: '0xeaBcd21B75349c59a4177E10ed17FBf2955fE697',
            deadline: deadline
        }]),
        nonfungiblePositionManager.interface.encodeFunctionData('refundETH'),
    ] as any);

    console.log('Pool created');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
