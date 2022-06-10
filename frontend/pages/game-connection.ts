import { Contract, providers } from "ethers";
import Game from "../public/Game.json";
import detectEthereumProvider from "@metamask/detect-provider";
import { gameAsk, gameGuess, gameRespond, gameStart, gameWon } from "./game";

export class GameConnection { 
   gameContract: Contract | undefined;
  
  async gameConnection():Promise<Contract> {
    if (this.gameContract) {
      return this.gameContract;
    }
    return await this.makeConnection();
  }

  private async makeConnection() {
    const provider = (await detectEthereumProvider()) as any;
    const ethersProvider = new providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const contract = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Game.abi, signer);
    this.gameContract = contract;
    return contract;
  }

  async selection() {
    const game = await this.gameConnection();
    console.log("Selecting the character");
    try {
      await gameStart([3, 2, 1, 0], 321, game);
      console.log("Character selected!");
      console.log("Game hash:", await game.hash());
    } catch (e) {
      console.log(e);
    }
  }

  async  ask() {
    const game = await this.gameConnection();
    console.log("Asking for 0,3");
    try {
      await gameAsk(0, 3, game);
      console.log("Question asked!");
      console.log("Question done. type:", await game.lastType(), "characteristic:", await game.lastCharacteristic());
    } catch (e) {
      console.log(e);
    }
  }
  async responseQuestion() {
    const game = await this.gameConnection();
    console.log("Response 1 for 0,3 question");
    try {
      await gameRespond([3, 2, 1, 0], 321, game);
      console.log("Question respond!");
      console.log("Question answer for ", await game.lastType(), "characteristic:", await game.lastCharacteristic(), "is:", await game.lastResponse());
    } catch (e) {
      console.log(e);
    }
  }
  async  guess() {
    const game = await this.gameConnection();
    console.log("Guess for 3210");
    try {
      await gameGuess([3, 2, 1, 0], game);
      console.log("Guess done!");
      console.log("Last Guess:", await game.lastGuess(0), await game.lastGuess(1), await game.lastGuess(2), await game.lastGuess(3));
    } catch (e) {
      console.log(e);
    }
  }
  async responseGuess() {
    const game = await this.gameConnection();
    console.log("Response for 3210 guess");
    try {
      await gameWon([3, 2, 1, 0], 321, game);
      console.log("Guess respond!");
      console.log("Guess answer for", await game.lastGuess(0), await game.lastGuess(1), await game.lastGuess(2), await game.lastGuess(3), "is:", await game.won());
    } catch (e) {
      console.log(e);
    }
  }
}