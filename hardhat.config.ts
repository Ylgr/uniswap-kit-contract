import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'dotenv/config';

const config: HardhatUserConfig = {
  solidity: {
      version: "0.7.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 800,
        },
        metadata: {
          // do not include the metadata hash, since this is machine dependent
          // and we want all generated code to be deterministic
          // https://docs.soliditylang.org/en/v0.7.6/metadata.html
          bytecodeHash: 'none',
        },
      },
  },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
        },
        arbitrumSepolia: {
            url: "https://sepolia-rollup.arbitrum.io/rpc",
            chainId: 421614,
            accounts: [process.env.PRIVATE_KEY as string],
        },
    },

    etherscan: {
        apiKey: {
            arbitrumSepolia: process.env.API_KEY,
        },
        customChains: [
            {
                network: "arbitrumSepolia",
                chainId: 421614,
                urls: {
                    apiURL: "https://api-sepolia.arbiscan.io/api",
                    browserURL: "https://sepolia.arbiscan.io/",
                },
            },
        ],
    },
};

export default config;
