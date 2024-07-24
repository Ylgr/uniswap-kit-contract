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

    function compareToken(a: { address: string }, b: { address: string }): -1 | 1 {
        console.log('a.address: ', a.address);
        console.log('b.address: ', b.address);
        return a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1
    }

    function sortedTokens(
        a: { address: string },
        b: { address: string }
    ): [typeof a, typeof b] | [typeof b, typeof a] {
        return compareToken(a, b) < 0 ? [a, b] : [b, a]
    }


    function GetPrice(PoolInfo){
        let sqrtPriceX96 = PoolInfo.SqrtX96;
        let Decimal0 = PoolInfo.Decimal0;
        let Decimal1 = PoolInfo.Decimal1;

        const buyOneOfToken0 = ((sqrtPriceX96 / 2**96)**2) / (10**Decimal1 / 10**Decimal0).toFixed(Decimal1);

        const buyOneOfToken1 = (1 / buyOneOfToken0).toFixed(Decimal0);
        console.log("price of token0 in value of token1 : " + buyOneOfToken0.toString());
        console.log("price of token1 in value of token0 : " + buyOneOfToken1.toString());
        console.log("");
        // Convert to wei
        const buyOneOfToken0Wei =(Math.floor(buyOneOfToken0 * (10**Decimal1))).toLocaleString('fullwide', {useGrouping:false});
        const buyOneOfToken1Wei =(Math.floor(buyOneOfToken1 * (10**Decimal0))).toLocaleString('fullwide', {useGrouping:false});
        console.log("price of token0 in value of token1 in lowest decimal : " + buyOneOfToken0Wei);
        console.log("price of token1 in value of token1 in lowest decimal : " + buyOneOfToken1Wei);
        console.log("");
    }

   const getMinTick = (tickSpacing: number) => Math.ceil(-887272 / tickSpacing) * tickSpacing
   const getMaxTick = (tickSpacing: number) => Math.floor(887272 / tickSpacing) * tickSpacing
   const getMaxLiquidityPerTick = (tickSpacing: number) =>
       (2n ** 128n - 1n)/(BigInt(getMaxTick(tickSpacing) - getMinTick(tickSpacing) / tickSpacing + 1))

    let token0;
    let token1;

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
    let staticOracle;

    let admin;
    let wallet1;
    let wallet2;
    let wallet3;
    const CARDINALITY_PER_MINUTE = 10;
    before(async () => {
        [admin, wallet1, wallet2, wallet3] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("UniswapV3Factory");
        factory = await Factory.deploy();
        factoryAddress = factory.target;

        const USDT = await ethers.getContractFactory("TestERC20");
        usdt = await USDT.deploy();
        usdt.address = usdt.target;
        usdtAddress = usdt.target;
        console.log('usdtAddress:', usdtAddress);

        const BIC = await ethers.getContractFactory("TestERC20");
        bic = await BIC.deploy();
        bic.address = bic.target;
        bicAddress = bic.target;
        console.log('bicAddress:', bicAddress);

        const Weth = await ethers.getContractFactory("TestWeth9");
        const weth = await Weth.deploy();

        const Router = await ethers.getContractFactory("SwapRouter");
        router = await Router.deploy(factoryAddress, weth.target);
        routerAddress = router.target;

        [token0, token1] = sortedTokens(usdt, bic);
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

        const OracleLibraryPlus = await ethers.getContractFactory("OracleLibraryPlus");
        const oracleLibraryPlus = await OracleLibraryPlus.deploy();
        const StaticOracle = await ethers.getContractFactory("StaticOracle", {
            // libraries: {
            //     OracleLibraryPlus: oracleLibraryPlus.target,
            // },
        });
        staticOracle = await StaticOracle.deploy(factoryAddress, CARDINALITY_PER_MINUTE);
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
        // const poolAddress = await factory.getPool(usdtAddress, bicAddress, 3000);
        // console.log('poolAddress:', poolAddress);
        // const pool = await ethers.getContractAt("UniswapV3Pool", poolAddress);

        // await factory.createPool(bicAddress, usdtAddress, FeeAmount.MEDIUM);
        // await pool.initialize(encodePriceSqrt(BigInt(1), BigInt(3)) as any) // 1 USD = 3 BIC

        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        await usdt.approve(nonfungiblePositionManagerAddress, ethers.parseEther("1000000"));
        await bic.approve(nonfungiblePositionManagerAddress, ethers.parseEther("1000000"));
        await nonfungiblePositionManager.multicall([
            nonfungiblePositionManager.interface.encodeFunctionData('createAndInitializePoolIfNecessary', [
                token0.target, token1.target, FeeAmount.MEDIUM, encodePriceSqrt(BigInt(1), BigInt(3)) as any
            ]),
            nonfungiblePositionManager.interface.encodeFunctionData('mint', [{
                token0: token0.address,
                token1: token1.address,
                fee: FeeAmount.MEDIUM,
                tickLower: getMinTick(FeeAmount.MEDIUM),
                tickUpper: getMaxTick(FeeAmount.MEDIUM),
                amount0Desired: ethers.parseEther("10000"),
                amount1Desired: ethers.parseEther("10000"),
                amount0Min: 0,
                amount1Min: 0,
                recipient: admin.address,
                deadline: deadline
            }]),
            nonfungiblePositionManager.interface.encodeFunctionData('refundETH'),
        ]);

        const path = [usdtAddress, bicAddress];
        const amountIn = ethers.parseEther("100");
        const amountOutMin = 0;
        // const amountOutMin = ethers.parseEther("290");
        const to = wallet1.address;
        await usdt.transfer(wallet1.address, amountIn);
        console.log('wallet1: ', wallet1.address);
        console.log('eth of wallet1: ', (await ethers.provider.getBalance(wallet1.address)).toString());
        console.log('usdt of wallet1: ', (await usdt.balanceOf(wallet1.address)).toString());
        console.log('bic of wallet1: ', (await bic.balanceOf(wallet1.address)).toString());
        await usdt.connect(wallet1).approve(routerAddress, amountIn);
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

        const position = await nonfungiblePositionManager.positions(1);
        // console.log('position:', position);
        // const sqrtPriceX96 = (await pool.slot0())[0];
        //
        // const PoolInfo = {
        //     SqrtX96: new bn(sqrtPriceX96.toString()),
        //     Decimal0: 18,
        //     Decimal1: 18
        // }
        // GetPrice(PoolInfo);
        // const poolAddress = await factory.getPool(usdtAddress, bicAddress, 3000);
        // console.log('poolAddress:', poolAddress);
        // // await ethers.provider.send('evm_increaseTime', [200])
        // const oraclePrice = await staticOracle.quoteSpecificPoolsWithTimePeriod(ethers.parseEther("100"), usdtAddress, bicAddress, [poolAddress], 2);
        // console.log('oraclePrice: ', oraclePrice)
    });

    it('increase liquidity', async () => {

        const poolAddress = await factory.getPool(usdtAddress, bicAddress, 3000);
        console.log('poolAddress:', poolAddress);
        const pool = await ethers.getContractAt("UniswapV3Pool", poolAddress);

        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
       await nonfungiblePositionManager.increaseLiquidity({
              tokenId: 1,
              amount0Desired: ethers.parseEther("333"),
              amount1Desired: ethers.parseEther("333"),
              amount0Min: 0,
              amount1Min: 0,
              deadline: deadline
       })

        const position = await nonfungiblePositionManager.positions(1);
        console.log('position:', position);

        const sqrtPriceX96 = (await pool.slot0()).sqrtPriceX96;

        const PoolInfo = {
            SqrtX96: new bn(sqrtPriceX96.toString()),
            Decimal0: 18,
            Decimal1: 18
        }
        GetPrice(PoolInfo);

        const path = [usdtAddress, bicAddress];
        const amountIn = ethers.parseEther("100");
        const amountOutMin = 0;
        // const amountOutMin = ethers.parseEther("290");
        const to = wallet1.address;
        await usdt.transfer(wallet1.address, amountIn);
        console.log('wallet1: ', wallet1.address);
        console.log('eth of wallet1: ', (await ethers.provider.getBalance(wallet1.address)).toString());
        console.log('usdt of wallet1: ', (await usdt.balanceOf(wallet1.address)).toString());
        console.log('bic of wallet1: ', (await bic.balanceOf(wallet1.address)).toString());
        await usdt.connect(wallet1).approve(routerAddress, amountIn);
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

    it('collect fees', async () => {
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        await nonfungiblePositionManager.collect({
            tokenId: 1,
            recipient: wallet1.address,
            amount0Max: ethers.parseEther("1"),
            amount1Max: ethers.parseEther("1")
        });

        const bicBalance = await bic.balanceOf(wallet1.address as any);
        console.log("bicBalance: ", ethers.formatEther(bicBalance));
        console.log('usdt of wallet1: ', (await usdt.balanceOf(wallet1.address)).toString())
    });
});
