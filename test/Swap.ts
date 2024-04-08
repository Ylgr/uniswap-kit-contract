import {ethers} from "hardhat";
import {normalizeSourceName} from "hardhat/utils/source-names";

import bn from 'bignumber.js'

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })

// returns the sqrt price as a 64x96
describe('Swap', () => {

    enum FeeAmount {
        LOW = 500,
        MEDIUM = 3000,
        HIGH = 10000,
    }

    function encodePriceSqrt(reserve1: BigInt, reserve0: BigInt): BigInt {
        return BigInt(
            new bn(reserve1.toString())
                .div(reserve0.toString())
                .sqrt()
                .multipliedBy(new bn(2).pow(96))
                .integerValue(3)
                .toString()
        )
    }

   const getMinTick = (tickSpacing: number) => Math.ceil(-887272 / tickSpacing) * tickSpacing
   const getMaxTick = (tickSpacing: number) => Math.floor(887272 / tickSpacing) * tickSpacing
   const getMaxLiquidityPerTick = (tickSpacing: number) =>
       (2n ** 128n - 1n)/(BigInt(getMaxTick(tickSpacing) - getMinTick(tickSpacing) / tickSpacing + 1))


    let usdt;
    let usdtAddress: string;
    let bic;
    let bicAddress: string;
    let router;
    let routerAddress: string;
    let factory;
    let factoryAddress: string;
    let nonfungiblePositionManager;
    let nonfungiblePositionManagerAddress: string;

    let admin;
    let wallet1;
    let wallet2;
    let wallet3;

    beforeEach(async () => {
        [admin, wallet1, wallet2, wallet3] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("UniswapV3Factory");
        factory = await Factory.deploy();
        factoryAddress = factory.target;

        const USDT = await ethers.getContractFactory("TestERC20");
        usdt = await USDT.deploy();
        usdtAddress = usdt.target;
        console.log('usdtAddress:', usdtAddress);

        const BIC = await ethers.getContractFactory("TestERC20");
        bic = await BIC.deploy();
        bicAddress = bic.target;
        console.log('bicAddress:', bicAddress);

        const Weth = await ethers.getContractFactory("TestWeth9");
        const weth = await Weth.deploy();

        const Router = await ethers.getContractFactory("SwapRouter");
        router = await Router.deploy(factoryAddress, weth.target);
        routerAddress = router.target;


        const nftDescriptorLibraryFactory = await ethers.getContractFactory('NFTDescriptor')
        const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy()

        const NonfungibleTokenPositionDescriptor = await ethers.getContractFactory("NonfungibleTokenPositionDescriptor", {
            libraries: {
                NFTDescriptor: nftDescriptorLibrary.target,
            },
        });
        const nonfungibleTokenPositionDescriptor = await NonfungibleTokenPositionDescriptor.deploy(
            weth.target,
            // 'ETH' as a bytes32 string
            '0x4554480000000000000000000000000000000000000000000000000000000000'
        );

        const NonfungiblePositionManager = await ethers.getContractFactory("NonfungiblePositionManager");
        nonfungiblePositionManager = await NonfungiblePositionManager.deploy(factoryAddress, weth.target, nonfungibleTokenPositionDescriptor.target);
        nonfungiblePositionManagerAddress = nonfungiblePositionManager.target;

        await factory.createPool(bicAddress, usdtAddress, 3000);
    });

    // it('should able to configure the pool', async () => {
    //     const poolAddress = await factory.getPool(bicAddress, usdtAddress, 3000);
    //     console.log('poolAddress:', poolAddress);
    //     const pool = await ethers.getContractAt("UniswapV3Pool", poolAddress);
    //     await pool.initialize(encodePriceSqrt(BigInt(3), BigInt(1)) as any)
    //         const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    //     pool.mint()
    // });

    it("should swap USDT to BIC in normal case", async () => {
        const poolAddress = await factory.getPool(usdtAddress, bicAddress, 3000);
        console.log('poolAddress:', poolAddress);
        const pool = await ethers.getContractAt("UniswapV3Pool", poolAddress);
        await pool.initialize(encodePriceSqrt(BigInt(1), BigInt(3)) as any)
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

        await usdt.approve(nonfungiblePositionManagerAddress, ethers.parseEther("1000000"));
        await bic.approve(nonfungiblePositionManagerAddress, ethers.parseEther("1000000"));
        await nonfungiblePositionManager.multicall([
            nonfungiblePositionManager.interface.encodeFunctionData('mint', [{
                token0: bicAddress,
                token1: usdtAddress,
                fee: FeeAmount.MEDIUM,
                tickLower: getMinTick(FeeAmount.MEDIUM),
                tickUpper: getMaxTick(FeeAmount.MEDIUM),
                amount0Desired: ethers.parseEther("10000"),
                amount1Desired: ethers.parseEther("10000"),
                amount0Min: 0,
                amount1Min: 0,
                recipient: wallet1.address,
                deadline: deadline
            }])
            // nonfungiblePositionManager.interface.encodeFunctionData('refundETH'),
        ]);

        const path = [usdtAddress, bicAddress];
        const amountIn = ethers.parseEther("100");
        const amountOutMin = 0;
        const to = wallet1.address;
        await usdt.transfer(wallet1.address, ethers.parseEther("100"));
        console.log('wallet1: ', wallet1.address);
        console.log('eth of wallet1: ', (await ethers.provider.getBalance(wallet1.address)).toString());
        console.log('usdt of wallet1: ', (await usdt.balanceOf(wallet1.address)).toString());
        console.log('bic of wallet1: ', (await bic.balanceOf(wallet1.address)).toString());
        await usdt.connect(wallet1).approve(routerAddress, ethers.parseEther("100"));
        const tx = await router.connect(wallet1).exactInputSingle({
            tokenIn: usdtAddress,
            tokenOut: bicAddress,
            fee: FeeAmount.MEDIUM,
            recipient: to,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        } as any);

        await tx.wait();
        const bicBalance = await bic.balanceOf(wallet1.address as any);
        console.log("bicBalance: ", ethers.formatEther(bicBalance));
        console.log('usdt of wallet1: ', (await usdt.balanceOf(wallet1.address)).toString());

    });
});
