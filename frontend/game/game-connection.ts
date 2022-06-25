import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, providers } from "ethers";
import Game from "../public/Game.json";
import networks from "../public/networks.json";
import { createGuessGame, GuessGame } from "./guess-game";

const VALID_CHARACTER: number[] = [3, 2, 1, 0]; //HARDCODED

export class GameConnection {
  private gameContract: Contract | undefined;
  private game: GuessGame | undefined;
  private isRegistered = false;

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
    let game = await this.getGame(character);

    // if the game is started should be not started
    if (await game.isStarted()) {
      throw new Error("Game already started");
    }

    // backup game storage
    const { saltLoaded, characterLoaded }: { saltLoaded: bigint | undefined; characterLoaded: number[] | undefined } = this.loadGame();

    //clear game with the selected character
    this.game = undefined;
    localStorage.removeItem("salt");
    localStorage.removeItem("character");
    game = await this.getGame(character);

    // create or join to the game
    try {
      await game.createOrJoin();
      //TODO: HACK TO NOT SHOW END GAME DIALOG IF NOT PLAYING
      localStorage.setItem("Playing", "true");
    } catch (e) {
      //rollback game
      if (saltLoaded && characterLoaded) {
        this.saveGame(characterLoaded, saltLoaded);
      }
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
    const guess = await this.getGame();
    try {
      await guess.answerAll();
    } catch (e) {
      console.log(e);
      throw e;
    }
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
    const game = await this.getGame();
    return await game.isStarted();
  }

  async isCreated() {
    return await this.gameContract?.isCreated();
  }

  async isPlayerInGame() {
    const game = await this.getGame();
    return game.isPlayerInGame();
  }

  async isAnswerTurn(): Promise<boolean> {
    const guess = await this.getGame();
    const isAnswerTurn = await guess.isAnswerTurn();
    return isAnswerTurn;
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

  private async getGame(character: number[] = VALID_CHARACTER) {
    // try to load form memory
    if (this.game) {
      return this.game;
    }

    //try to load form localStorage
    const { saltLoaded, characterLoaded }: { saltLoaded: bigint | undefined; characterLoaded: number[] | undefined } = this.loadGame();

    const salt = saltLoaded ? saltLoaded : randomGenerator();
    character = characterLoaded ? characterLoaded : character;

    // generate new game
    this.game = await this.createGame(character, salt);

    // save to localStorage
    this.saveGame(character, salt);

    return this.game;
  }

  private loadGame() {
    let saltLoaded: bigint | undefined;
    const saltStorage = localStorage.getItem("salt");
    if (saltStorage) {
      saltLoaded = BigInt(JSON.parse(saltStorage));
    }

    const characterStorage = localStorage.getItem("character");
    let characterLoaded: number[] | undefined;
    if (characterStorage) {
      const characterParsed = JSON.parse(characterStorage);
      characterLoaded = [characterParsed[0], characterParsed[1], characterParsed[2], characterParsed[3]] as number[];
    }
    return { saltLoaded, characterLoaded };
  }

  private saveGame(character: number[], salt: bigint) {
    localStorage.setItem("salt", JSON.stringify(salt.toString()));
    localStorage.setItem("character", JSON.stringify(character));
  }

  private async createGame(character: number[], salt: bigint) {
    const connection = await this.gameConnection();
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

  private async register(
    handleOnQuestionAsked: (position: number, number: number) => void,
    handleOnQuestionAnswered: (answer: number) => void,
    handleOnGuess: (guess: number[]) => void,
    handleOnGuessResponse: (response: number) => void,
    handleOnJoined: () => void,
    handleOnCreated: () => void
  ) {
    const game = await this.getGame();

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

const randomGenerator = function randomBigInt(): bigint {
  return BigInt(Math.floor(Math.random() * 10 ** 8));
};
