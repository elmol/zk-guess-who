import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, providers } from "ethers";
import Game from "../public/Game.json";
import networks from "../public/networks.json";
import { createGuessGame, GuessGame, randomGenerator } from "./guess-game";

export class GameConnection {
  private gameContract: Contract | undefined;
  private game: GuessGame | undefined;
  private isRegistered = false;
  private gameCreationMethod = async (character: number[], salt: bigint) => {
    const connection = await this.gameConnection();
    return factoryCreateGuessGame(connection, character, salt);
  };

  async init(
    handleOnQuestionAsked: (position: number, number: number) => void,
    handleOnQuestionAnswered: (answer: number) => void,
    handleOnGuess: (guess: number[]) => void,
    handleOnGuessResponse: (response: number) => void,
    handleOnJoined: () => void,
    handleOnCreated: () => void
  ) {
    if (!this.isRegistered) {
      await this.register(handleOnQuestionAsked, handleOnQuestionAnswered, handleOnGuess, handleOnGuessResponse, handleOnJoined, handleOnCreated);
      this.isRegistered = true;
    }
  }

  async createOrJoin(character: number[]) {
    try {
      this.game = await GuessGame.create(localStorage, character, this.gameCreationMethod);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async question(position: number, number: number) {
    const game = await this.getGame();
    try {
      await game.question(position, number);
      const lastQuestion = await this.getLastQuestion();
      console.log("Last Question: ", lastQuestion);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async guess(guess: number[]) {
    const game = await this.getGame();
    try {
      await game.guess(guess);
      console.log("Last Guess:", await this.gameContract?.lastGuess(0), await this.gameContract?.lastGuess(1), await this.gameContract?.lastGuess(2), await this.gameContract?.lastGuess(3));
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async answerAll() {
    const game = await this.getGame();
    try {
      await game.answerAll();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
  async quit() {
    const game = await this.getGame();
    try {
      await game.quit();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async storeNotPlaying() {
    const connection = await this.gameConnection();
    const address = await connection.signer.getAddress();
    GuessGame.storeNotPlaying(localStorage,address);
  }

  async isStoredPlaying() {
    const connection = await this.gameConnection();
    const address = await connection.signer.getAddress();
    return GuessGame.isStoredPlaying(localStorage,address);
  }

  // Game State Getters
  async getLastQuestion() {
    const lastQuestionType = await this.gameContract?.lastType();
    const lastQuestionCharacteristic = await this.gameContract?.lastCharacteristic();
    return { type: lastQuestionType, characteristic: lastQuestionCharacteristic };
  }

  async getLastAnswer() {
    return await this.gameContract?.lastResponse();
  }

  async getLastGuess() {
    return [await this.gameContract?.lastGuess(0), await this.gameContract?.lastGuess(1), await this.gameContract?.lastGuess(2), await this.gameContract?.lastGuess(3)];
  }

  async getLastGuessAnswer() {
    return await this.gameContract?.won();
  }

  async isWinner(): Promise<boolean> {
    return await this.gameContract?.isWinner();
  }

  // Game Flow methods
  async isStarted() {
    return await this.gameContract?.isStarted();
  }

  async isCreated() {
    return await this.gameContract?.isCreated();
  }

  async isPlayerInGame() {
    return await this.gameContract?.isPlayerInGame();
  }

  async isAnswerTurn(): Promise<boolean> {
    return this.gameContract?.isAnswerTurn();
  }

  async isQuestionTurn() {
    return await this.gameContract?.isQuestionTurn();
  }

  /// PRIVATE METHODS //////////////////////////////////

  private async gameConnection(): Promise<Contract> {
    if (this.gameContract) {
      return this.gameContract;
    }
    return await this.makeConnection();
  }

  private async makeConnection() {
    const provider = (await detectEthereumProvider()) as any;
    const ethersProvider = new providers.Web3Provider(provider);
    await provider.send("eth_requestAccounts", []);
    const signer = ethersProvider.getSigner();
    let chainId = await provider.request({ method: "eth_chainId" });
    console.log("Connected chain id:", chainId, parseInt(chainId));
    const parsedChainId = parseInt(chainId).toString() as keyof typeof networks;
    const address = networks[parsedChainId]?.address;
    if (!address) {
      throw new Error("No address found for chain id: " + parsedChainId);
    }
    console.log("Contract address:", address);
    const contract = new Contract(address, Game.abi, signer);
    this.gameContract = contract;
    return contract;
  }

  private async getGame() {
    // try to load form memory
    if (this.game) {
      return this.game;
    }

    //try to load form localStorage
    try {
      const connection = await this.gameConnection();
      const address = await connection.signer.getAddress();
      this.game = await GuessGame.load(localStorage, address, this.gameCreationMethod);
    } catch (error) {
      console.log(error);
      throw error;
    }

    return this.game;
  }

  private async register(
    handleOnQuestionAsked: (position: number, number: number) => void,
    handleOnQuestionAnswered: (answer: number) => void,
    handleOnGuess: (guess: number[]) => void,
    handleOnGuessResponse: (response: number) => void,
    handleOnJoined: () => void,
    handleOnCreated: () => void
  ) {
    // HARCODED: hardcoded just for creating the event Handling
    // need to move to another classes
    const VALID_CHARACTER: number[] = [3, 2, 1, 0]; //HARDCODED
    const game = await this.gameCreationMethod(VALID_CHARACTER, BigInt(123));

    game.onQuestionAsked(async (position: number, number: number) => {
      console.log("On Question Asked:", position, number);
      await handleOnQuestionAsked(position, number);
    });

    game.onQuestionAnswered(async (answer: number) => {
      console.log("On Question Answered:", answer);
      await handleOnQuestionAnswered(answer);
    });

    game.onGuess(async (guess: number[]) => {
      console.log("On Guess", guess);
      await handleOnGuess(guess);
    });

    game.onGuessResponse(async (response: number) => {
      console.log("On Guess Response", response);
      await handleOnGuessResponse(response);
    });

    game.onPlayerJoined(async () => {
      await handleOnJoined();
    });

    game.onGameCreated(async () => {
      await handleOnCreated();
    });
  }
}

function factoryCreateGuessGame(connection: Contract, character: number[], salt: bigint) {
  const boardZKFiles = {
    wasm: "./board.wasm",
    zkey: "./circuit_final_board.zkey",
  };

  const questionZKFiles = {
    wasm: "./question.wasm",
    zkey: "./circuit_final_question.zkey",
  };

  const guessZKFiles = {
    wasm: "./guess.wasm",
    zkey: "./circuit_final_guess.zkey",
  };
  return createGuessGame(connection, boardZKFiles, questionZKFiles, guessZKFiles, character, salt);
}
