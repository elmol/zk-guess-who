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
    handleOnGuessResponse: (response: number) => void,
    handleOnJoined: () => void,
    handleOnCreated: () => void
  ) {
    if (!this.isRegistered) {
      console.log("Registering handlers...");
      await this.register(handleOnQuestionAsked, handleOnQuestionAnswered, handleOnGuess, handleOnGuessResponse,handleOnJoined,handleOnCreated);
      this.isRegistered = true;
    }
    console.log("Guess Game Connection initialized");
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

    game.onPlayerJoined(async () => {
      await handleOnJoined();
    });

    game.onGameCreated(async () => {
      await handleOnCreated();
    });
  }

  async selection(character: number[]) {
    let guess = await this.getGame(character);

    // if the game is started should be not started
    if (await guess.isStarted()) {
      throw new Error("Game already started");
    }

    // backup game storage
    const { saltLoaded, characterLoaded }: { saltLoaded: bigint | undefined; characterLoaded: number[] | undefined } = this.loadGame();
    console.log("CREATE-JOIN: Backup game storage:", saltLoaded, characterLoaded);
    console.log("CREATE-JOIN: Backup game Hash for this account", await this.gameContract?.hashByAccount());
    console.log("CREATE-JOIN: hash(0)", await this.gameContract?.hash(0));
    console.log("CREATE-JOIN: hash(1)", await this.gameContract?.hash(1));

    //clear game with the selected character
    this.game = undefined;
    localStorage.removeItem("salt");
    localStorage.removeItem("character");
    guess = await this.getGame(character);

    console.log("CREATE-JOIN: Game Cleaned:", guess);
    console.log("CREATE-JOIN: Game Cleaned Hash", await this.gameContract?.hashByAccount());
    console.log("CREATE-JOIN: hash(0)", await this.gameContract?.hash(0));
    console.log("CREATE-JOIN: hash(1)", await this.gameContract?.hash(1));
    
    // create or join to the game
    try {
      await await guess.createOrJoin();
      console.log("CREATE-JOIN: After create or join:", guess);
      console.log("CREATE-JOIN: create or join Hash", await this.gameContract?.hashByAccount());
      console.log("CREATE-JOIN: hash(0)", await this.gameContract?.hash(0));
      console.log("CREATE-JOIN: hash(1)", await this.gameContract?.hash(1));
      //TODO: HACK TO NOT SHOW END GAME DIALOG IF NOT PLAYING
       localStorage.setItem("Playing", "true");
    } catch (e) {
      //rollback game
      if (saltLoaded && characterLoaded) {
        this.saveGame(characterLoaded, saltLoaded);
        console.log("CREATE-JOIN: ROLLBACK game storage:", saltLoaded, characterLoaded);
        console.log("CREATE-JOIN: ROLLBACK game Hash for this account", await this.gameContract?.hashByAccount());
        console.log("CREATE-JOIN: hash(0)", await this.gameContract?.hash(0));
        console.log("CREATE-JOIN: hash(1)", await this.gameContract?.hash(1));
      }
      console.log(e);
      throw e;
    }
  }

  async isAnswerTurn(): Promise<boolean> {
    const guess = await this.getGame();
    return guess.isAnswerTurn();
  }

  async isWinner(): Promise<boolean> {
    return await this.gameContract?.isWinner();
  }

  async askQuestion(position: number, number: number) {
    const guess = await this.getGame();
    console.log("Asking for", position, number);
    try {
      console.log("ASK-QUESTION: BEFORE game Hash for this account", await this.gameContract?.hashByAccount());
      console.log("ASK-QUESTION: BEFORE hash(0)", await this.gameContract?.hash(0));
      console.log("ASK-QUESTION: BEFORE hash(1)", await this.gameContract?.hash(1));
      await guess.question(position, number);
      console.log("Question asked!");
      const lastQuestion = await this.getLastQuestion();
      console.log("ASK-QUESTION: game Hash for this account", await this.gameContract?.hashByAccount());
      console.log("ASK-QUESTION: hash(0)", await this.gameContract?.hash(0));
      console.log("ASK-QUESTION: hash(1)", await this.gameContract?.hash(1));
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
    console.log("ANSWER-QUESTION: game", guess);
    console.log("ANSWER-QUESTION: hash(0)", await this.gameContract?.hash(0));
    console.log("ANSWER-QUESTION: hash(1)", await this.gameContract?.hash(1));
    console.log("ANSWER-QUESTION: Hash by account", await this.gameContract?.hashByAccount());
    console.log("ANSWER-QUESTION: turn", await this.gameContract?.currentTurn());
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

  async answerAll() {
    const guess = await this.getGame();
    console.log("ANSWER-ALL: game", guess);
    console.log("ANSWER-ALL: hash(0)", await this.gameContract?.hash(0));
    console.log("ANSWER-ALL: hash(1)", await this.gameContract?.hash(1));
    console.log("ANSWER-ALL: Hash by account", await this.gameContract?.hashByAccount());
    console.log("ANSWER-ALL: turn", await this.gameContract?.currentTurn());
    try {
      await guess.answerAll();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async isQuestionTurn() {
     return await this.gameContract?.isQuestionTurn();
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

  async isCreated() {
   return await this.gameContract?.isCreated()
  }

  async isPlayerInGame() {
    const game = await this.getGame();
    return game.isPlayerInGame();
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
    console.log("character storage:", characterStorage);
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
}

const randomGenerator = function randomBigInt(): bigint {
  return BigInt(Math.floor(Math.random() * 10 ** 8));
};
