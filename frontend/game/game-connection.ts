import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, providers } from "ethers";
import Game from "../public/Game.json";
import networks from "../public/networks.json";
import { createGuessGame, GuessGame } from "./guess-game";

const VALID_CHARACTER: number[] = [3, 2, 1, 0]; //HARDCODED
const SALT: number = 123; //HARDCODED

export class GameConnection {
  gameContract: Contract | undefined;
  private game: GuessGame | undefined;

  private filterQuestionEvent = false;
  private initLastQuestion = { type: -1, characteristic: -1 };

  private filterAnswerEvent = false;
  private initLastAnswer = -1;

  async gameConnection(): Promise<Contract> {
    if (this.gameContract) {
      return this.gameContract;
    }
    return await this.makeConnection();
  }

  private async makeConnection() {
    console.log("making connection");
    const provider = (await detectEthereumProvider()) as any;
    console.log("provider:", provider);
    const ethersProvider = new providers.Web3Provider(provider);
    console.log("ethersProvider:", ethersProvider);
    await provider.send('eth_requestAccounts', []); 
    const signer = ethersProvider.getSigner();
    console.log("signer:", signer);
    let chainId = await provider.request({ method: 'eth_chainId' });
    console.log("Connected chain id:", chainId, parseInt(chainId));
    const parsedChainId = parseInt(chainId).toString() as keyof typeof networks;
    const address = networks[parsedChainId].address;
    console.log("Contract address:", address);
    const contract = new Contract(address, Game.abi, signer);
    this.gameContract = contract;
    return contract;
  }

  async init(handleOnQuestionAsked: (position: number, number: number) => void, handleOnQuestionAnswered: (answer: number) => void, handleOnGuess: (guess: number[]) => void, handleOnGuessResponse: (response: number) => void) {
    const game = await this.getGame();
    this.initLastQuestion = await this.getLastQuestion();

    game.onQuestionAsked(async (position:number, number:number) => {
      // console.log("Checking if question is the same as last question");
      // console.log("Last question:", this.initLastQuestion);
      // console.log("New question:", { position, number });
      // console.log("Filter is:", this.filterQuestionEvent);
      if (!this.filterQuestionEvent && this.initLastQuestion.type !== position && this.initLastQuestion.characteristic !== number) {
        return;
      }
      await handleOnQuestionAsked(position, number);
      this.filterQuestionEvent = true;
    });

    this.initLastAnswer = await this.getLastAnswer();
    game.onQuestionAnswered(async (answer: number) => {
      // console.log("Checking if answer is the same as last answer");
      // console.log("Last answer:", this.initLastAnswer);
      // console.log("New answer:", answer);
      // console.log("Filter is:", this.filterAnswerEvent);
      if (!this.filterAnswerEvent && this.initLastAnswer !== answer) {
        return;
      }
      await handleOnQuestionAnswered(answer);
      this.filterAnswerEvent = true;
    });

    game.onGuess(async (guess: number[]) => {
      console.log("On Guess",guess);
      await handleOnGuess(guess);
    });

    game.onGuessResponse(async (response: number) => {
      console.log("On Guess Response",response);
      await handleOnGuessResponse(response);
    });

    console.log("Guess Game Connection initialized");
  }

  async selection() {
    const guess = await this.getGame();
    console.log("Selecting the character");
    try {
      await await guess.start();
      console.log("Character selected!");
      console.log("Game hash:", await this.gameContract?.hash());
    } catch (e) {
      console.log(e);
    }
  }

  async askQuestion(position: number, number: number) {
    const guess = await this.getGame();
    console.log("Asking for", position, number);
    try {
      await guess.question(position, number);
      console.log("Question asked!");
      const lastQuestion = await this.getLastQuestion();
      console.log("Question done. type:", lastQuestion.type, "characteristic:", lastQuestion.characteristic);
    } catch (e) {
      console.log(e);
    }
  }

  async getLastQuestion() {
    const lastQuestionType = await this.gameContract?.lastType();
    const lastQuestionCharacteristic = await this.gameContract?.lastCharacteristic();
    return { type: lastQuestionType, characteristic: lastQuestionCharacteristic };
  }

  async responseQuestion() {
    const guess = await this.getGame();
    try {
      await guess.answer();
      console.log("Question respond!");
      const lastQuestion = await this.getLastQuestion();
      console.log("Question answer for ", lastQuestion.type, "characteristic:", lastQuestion.characteristic, "is:", await this.gameContract?.lastResponse());
    } catch (e) {
      console.log(e);
    }
  }

  async getLastAnswer() {
    const asw = await this.gameContract?.lastResponse();
    console.log("Last Answer:", asw);
    return asw;
  }

  async getLastGuess() {
    const asw= [await this.gameContract?.lastGuess(0), await this.gameContract?.lastGuess(1), await this.gameContract?.lastGuess(2), await this.gameContract?.lastGuess(3)];
    console.log("Last Guess:", asw);
    return asw;
  }
  async getLastGuessResponse() {
    const asw = await this.gameContract?.won();
    console.log("Last Guess Response:", asw);
    return asw;
  }
  

  async guess(guess: number[]) {
    const game = await this.getGame();
    console.log("Guess for",guess);
    try {
      await game.guess(guess);
      console.log("Guess done!");
      console.log("Last Guess:", await this.gameContract?.lastGuess(0), await this.gameContract?.lastGuess(1), await this.gameContract?.lastGuess(2), await this.gameContract?.lastGuess(3));
    } catch (e) {
      console.log(e);
    }
  }
  
  async responseGuess() {
    const guess = await this.getGame();
    console.log("Response for 3210 guess");
    try {
      await guess.guessAnswer();
      console.log("Guess respond!");
      console.log(
        "Guess answer for",
        await this.gameContract?.lastGuess(0),
        await this.gameContract?.lastGuess(1),
        await this.gameContract?.lastGuess(2),
        await this.gameContract?.lastGuess(3),
        "is:",
        await this.gameContract?.won()
      );
    } catch (e) {
      console.log(e);
    }
  }

  private async getGame() {
    const connection = await this.gameConnection();
    if (this.game) {
      return this.game;
    }
    return createGuessGame(connection, VALID_CHARACTER, SALT);
  }
}
