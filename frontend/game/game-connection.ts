import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, providers } from "ethers";
import Game from "../public/Game.json";
import networks from "../public/networks.json";
import { createGuessGame, GuessGame } from "./guess-game";

const VALID_CHARACTER: number[] = [3, 2, 1, 0]; //HARDCODED

export class GameConnection {
  gameContract: Contract | undefined;
  private game: GuessGame | undefined;

  private filterQuestionEvent = false;
  private initLastQuestion = { type: -1, characteristic: -1 };

  private filterAnswerEvent = false;
  private initLastAnswer = -1;

  private isRegistered = false;

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
    await provider.send("eth_requestAccounts", []);
    const signer = ethersProvider.getSigner();
    console.log("signer:", signer);
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

  async init(
    handleOnQuestionAsked: (position: number, number: number) => void,
    handleOnQuestionAnswered: (answer: number) => void,
    handleOnGuess: (guess: number[]) => void,
    handleOnGuessResponse: (response: number) => void
  ) {
    if (!this.isRegistered) {
      console.log("Registering handlers...");
      await this.register(handleOnQuestionAsked, handleOnQuestionAnswered, handleOnGuess, handleOnGuessResponse);
      this.isRegistered = true;
    }
    console.log("Guess Game Connection initialized");
  }

  private async register(
    handleOnQuestionAsked: (position: number, number: number) => void,
    handleOnQuestionAnswered: (answer: number) => void,
    handleOnGuess: (guess: number[]) => void,
    handleOnGuessResponse: (response: number) => void
  ) {
    const game = await this.getGame();

    game.onQuestionAsked(async (position: number, number: number) => {
      // console.log("Checking if question is the same as last question");
      // console.log("Last question:", this.initLastQuestion);
      // console.log("New question:", { position, number });
      // console.log("Filter is:", this.filterQuestionEvent);
      // this.initLastQuestion = await this.getLastQuestion();
      // if (!this.filterQuestionEvent && this.initLastQuestion.type !== position && this.initLastQuestion.characteristic !== number) {
      //   console.log("Question Asked:", position, number,"FILTERED", this.filterQuestionEvent, this.initLastQuestion.type, this.initLastQuestion.characteristic);
      //   return;
      // }
      await handleOnQuestionAsked(position, number);
      // this.filterQuestionEvent = true;
      // console.log("Question Asked:", position, number,"NOT FILTERED");
    });

    game.onQuestionAnswered(async (answer: number) => {
      // console.log("Checking if answer is the same as last answer");
      // console.log("Last answer:", this.initLastAnswer);
      // console.log("New answer:", answer);
      // console.log("Filter is:", this.filterAnswerEvent);
      // this.initLastAnswer = await this.getLastAnswer();
      // if (!this.filterAnswerEvent && this.initLastAnswer !== answer) {
      //   return;
      // }
      await handleOnQuestionAnswered(answer);
      // this.filterAnswerEvent = true;
    });

    game.onGuess(async (guess: number[]) => {
      console.log("On Guess", guess);
      await handleOnGuess(guess);
    });

    game.onGuessResponse(async (response: number) => {
      console.log("On Guess Response", response);
      await handleOnGuessResponse(response);
    });
  }

  async selection(character: number[]) {
    let guess = await this.getGame(character);
    if(await guess.isStarted()) {
      console.log("Game already started");
      throw new Error("Game already started");
    }
    this.game=undefined;
    guess = await this.getGame(character);

    console.log("Selecting the character");
    try {
      await await guess.start();
      console.log("Character selected!");
      console.log("Game hash:", await this.gameContract?.hash());
    } catch (e) {
      console.log(e);
      throw e;
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
      throw e;
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
      throw e;
    }
  }

  async getLastAnswer() {
    const asw = await this.gameContract?.lastResponse();
    console.log("Last Answer:", asw);
    return asw;
  }

  async getLastGuess() {
    const asw = [await this.gameContract?.lastGuess(0), await this.gameContract?.lastGuess(1), await this.gameContract?.lastGuess(2), await this.gameContract?.lastGuess(3)];
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
    console.log("Guess for", guess);
    try {
      await game.guess(guess);
      console.log("Guess done!");
      console.log("Last Guess:", await this.gameContract?.lastGuess(0), await this.gameContract?.lastGuess(1), await this.gameContract?.lastGuess(2), await this.gameContract?.lastGuess(3));
    } catch (e) {
      console.log(e);
      throw e;
    }
  }


  async isStarted() {
    const game = await this.getGame();
    return await game.isStarted();
  }
  
  async responseGuess() {
    const guess = await this.getGame();
    try {
      await guess.guessAnswer();
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
      throw e;
    }
  }

  private async getGame(character: number[] = VALID_CHARACTER) {
    // try to load form memory
    console.log("game:", this.game);
    if (this.game) {
      return this.game;
    }

    //try to load form localStorage
    let salt;
    const saltStorage = localStorage.getItem("salt");
    if (saltStorage) {
      salt = BigInt(JSON.parse(saltStorage));
    } else {
      salt = randomGenerator();
    }

    // generate new game
    console.log("new game created...");
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
    const connection = await this.gameConnection();
    this.game = createGuessGame(connection, boardZKFiles, questionZKFiles, guessZKFiles, character, salt);
    localStorage.setItem("salt", JSON.stringify(salt.toString()));
    return this.game;
  }
}

const randomGenerator = function randomBigInt(): bigint {
  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  return BigInt(Math.floor(Math.random() * 10 ** 8));
};
