// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
// eslint-disable-next-line camelcase
import { Game__factory } from "../typechain";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  const gameFactory = (await ethers.getContractFactory(
    "Game"
  )) as Game__factory;
  const game = gameFactory.attach("0xd09f1D18e4013DB38Bf298946F1E1A994F813DE6");
  console.log("Game deployed to:", game.address);
  await game.reset();
  console.log("Game Reseted");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
