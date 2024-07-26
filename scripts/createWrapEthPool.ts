import {ethers, run} from 'hardhat';
import DeployedAddress from '../ignition/deployments/chain-421614/deployed_addresses.json';
import bn from "bignumber.js";

enum FeeAmount {
    LOW = 500,
    MEDIUM = 3000,
    HIGH = 10000,
}

function encodePriceSqrt(reserve1: string, reserve0: string): BigInt {
    bn.config({ EXPONENTIAL_AT: 32 })
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
    const ethAmount = '2';

    const priceEth = 47853538;
    const priceThisIsFineToken = 1000;

    const wrapEth = await ethers.getContractAt('TestWeth9', '0xAA84765a5fDE01FDC84519eF13C9aC3b6D47E26F');
    await wrapEth.deposit({ value: ethers.parseEther(ethAmount) } as any);
    // const thisIsFineToken = await ethers.getContractAt('ThisIsFineToken', '0x3c00AFe38b1Db109A0f740368063Db1608E0bb77');
    const thisIsFineToken = await ethers.getContractAt('ThisIsFineToken', '0xE8AFce87993Bd475FAf2AeA62e0B008Dc27Ab81A');
    const [token0, token1] = sortedTokens(wrapEth as { target: string }, thisIsFineToken as { target: string });

    const nonfungiblePositionManagerAddress = DeployedAddress["NonfungiblePositionManager#NonfungiblePositionManager"];
    const nonfungiblePositionManager = await ethers.getContractAt('NonfungiblePositionManager', nonfungiblePositionManagerAddress);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    await wrapEth.approve(nonfungiblePositionManagerAddress as any, ethers.parseEther(ethAmount) as any);
    await thisIsFineToken.approve(nonfungiblePositionManagerAddress as any, ethers.parseEther("100000") as any);
    let price0, price1, amount0Desired, amount1Desired;
    if(token0.target === wrapEth.target) {
        price0 = priceEth;
        price1 = priceThisIsFineToken;
        amount0Desired = ethers.parseEther(ethAmount);
        amount1Desired = ethers.parseEther("100000");

    } else {
        price0 = priceThisIsFineToken;
        price1 = priceEth;
        amount0Desired = ethers.parseEther("100000");
        amount1Desired = ethers.parseEther(ethAmount);
    }
    await nonfungiblePositionManager.multicall([
        nonfungiblePositionManager.interface.encodeFunctionData('createAndInitializePoolIfNecessary', [
            token0.target as string, token1.target as string, FeeAmount.MEDIUM, encodePriceSqrt(price0.toString(), price1.toString())
        ]),
        nonfungiblePositionManager.interface.encodeFunctionData('mint', [{
            token0: token0.target,
            token1: token1.target,
            fee: FeeAmount.MEDIUM,
            tickLower: getMinTick(FeeAmount.MEDIUM),
            tickUpper: getMaxTick(FeeAmount.MEDIUM),
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
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
