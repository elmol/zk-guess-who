import { Contract } from "ethers";
import { GameZK, ZKFiles } from "./game-zk";

interface GameData {
  character: number[];
  salt: bigint;
  playing: boolean;
}

export class GuessGame {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private gameContract: Contract,
    private gameZK: GameZK,
    private character: number[],
    private salt: bigint = randomGenerator()
  ) {}

  get contract(): Contract {
    return this.gameContract;
  }

  async createOrJoin(): Promise<String> {
    if (await this.gameContract.isStarted()) {
      throw new Error("Game Room already full");
    }
    // generating proof character selection
    const selection = await this.gameZK.selectionProof(
      this.character,
      this.salt
    );
    const hash = selection.input[0];

    // sending proof to contract
    const tx = await this.gameContract.createOrJoin(
      hash,
      selection.piA,
      selection.piB,
      selection.piC
    );
    await tx.wait();

    return hash;
  }

  async question(type: number, characteristic: number) {
    const tx = await this.gameContract.ask(type, characteristic);
    await tx.wait();
  }

  async guess(guess: number[]) {
    const tx = await this.gameContract.guess(guess);
    await tx.wait();
  }

  async answerAll() {
    // question pending answer
    if ((await this.gameContract.lastResponse()) === 0) {
      return this.answer();
    }

    // guess pending answer
    if ((await this.gameContract.won()) === 0) {
      return this.guessAnswer();
    }

    throw new Error("No answer pending");
  }

  async quit() {
    const tx = await this.gameContract.reset();
    await tx.wait();
  }

  connect(signer: any) {
    this.gameContract = this.gameContract.connect(signer);
  }

  // Game State methods

  async isWon(): Promise<boolean> {
    return await this.gameContract.isWon();
  }

  // Game Flow methods
  async isStarted(): Promise<boolean> {
    return await this.gameContract.isStarted();
  }

  async isAnswerTurn(): Promise<boolean> {
    return await this.gameContract.isAnswerTurn();
  }

  async isPlayerInGame(): Promise<boolean> {
    return await this.gameContract.isPlayerInGame();
  }

  // Event Handling
  onQuestionAsked(callback: (type: number, characteristic: number) => void) {
    this.gameContract.on("QuestionAsked", callback);
  }

  onQuestionAnswered(callback: (answer: number) => void) {
    this.gameContract.on("QuestionAnswered", callback);
  }

  onGuess(callback: (guess: number[]) => void) {
    this.gameContract.on("Guess", callback);
  }

  onGuessResponse(callback: (answer: number) => void) {
    this.gameContract.on("GuessResponse", callback);
  }

  onPlayerJoined(callback: () => void) {
    this.gameContract.on("Joined", callback);
  }

  onGameCreated(callback: () => void) {
    this.gameContract.on("GameCreated", callback);
  }

  onGameQuitted(callback: () => void) {
    this.gameContract.on("GameQuitted", callback);
  }

  // GAME STORAGE HANDLING
  // eslint-disable-next-line no-undef
  async save(storage: Storage) {
    const address = await this.gameContract.signer.getAddress();
    const gameData: GameData = {
      character: this.character,
      salt: this.salt,
      playing: true,
    };
    GuessGame.saveDataByAccount(storage, gameData, address);
    // TODO: HACK TO NOT SHOW END GAME DIALOG IF NOT PLAYING
    // this.storeIsPlaying(storage, address);
  }

  private static saveDataByAccount(
    // eslint-disable-next-line no-undef
    storage: Storage,
    gameData: GameData,
    account: string
  ) {
    storage.setItem(account + "-game", this.toJson(gameData));
  }

  // because Do not know how to serialize a BigInt Error
  private static toJson(data: GameData) {
    return JSON.stringify({
      character: data.character,
      salt: data.salt.toString(),
      playing: data.playing,
    });
  }

  private static toObject(data: string): GameData {
    const gameDataLoaded = JSON.parse(data);
    return {
      character: gameDataLoaded.character,
      // eslint-disable-next-line node/no-unsupported-features/es-builtins
      salt: BigInt(gameDataLoaded.salt),
      playing: gameDataLoaded.playing,
    };
  }

  // eslint-disable-next-line no-undef
  static loadDataByAccount(storage: Storage, account: string) {
    const gameData = storage.getItem(account + "-game");
    if (!gameData) {
      return undefined;
    }

    return this.toObject(gameData);
  }

  // Need a connection;
  static async load(
    // eslint-disable-next-line no-undef
    storage: Storage,
    address: string,
    gameCreate: (character: number[], salt: bigint) => Promise<GuessGame>
  ) {
    const storedGame = GuessGame.loadDataByAccount(storage, address);

    if (!storedGame) {
      throw new Error("Game not found");
    }

    // in case does not exist create a random salt
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    const saltToSave = storedGame.salt;
    const characterToSave = storedGame.character;

    // create new game instance
    return await gameCreate(characterToSave, saltToSave);
  }

  static async create(
    // eslint-disable-next-line no-undef
    storage: Storage,
    character: number[],
    gameCreate: (character: number[], salt: bigint) => Promise<GuessGame>
  ) {
    // create new game instance
    const characterToSave = character;
    const saltToSave = randomGenerator();
    const newGame = await gameCreate(characterToSave, saltToSave);

    // create or join to the game
    await newGame.createOrJoin();

    await newGame.save(storage);

    return newGame;
  }

  // eslint-disable-next-line no-undef
  static isStoredPlaying(storage: Storage, address: string): boolean {
    // TODO: WORKAROUND TO HANDLE END OF GAME WHEN INIT
    const gameData = storage.getItem(address + "-game");
    if (!gameData) {
      return false;
    }
    const gameDataLoaded = JSON.parse(gameData);
    return gameDataLoaded.playing;
  }

  // eslint-disable-next-line no-undef
  static storeNotPlaying(storage: Storage, address: string) {
    storage.removeItem(address + "-game");
  }

  // PRIVATE METHODS
  private async answer() {
    if (!(await this.gameContract.isStarted())) {
      throw new Error("Game not started");
    }

    if (!(await this.gameContract.isAnswerTurn())) {
      throw new Error("Only current player turn can answer");
    }

    const type = await this.gameContract.lastType();
    const characteristic = await this.gameContract.lastCharacteristic();
    const hash = await this.gameContract.hashByAccount();

    // generate question proof
    const question = await this.gameZK.questionProof(
      this.character,
      this.salt,
      type,
      characteristic,
      hash.toString()
    );
    const answer = parseInt(question.input[0]);

    const tx = await this.gameContract.response(
      answer,
      question.piA,
      question.piB,
      question.piC
    );
    await tx.wait();

    return answer + 1; // 0 is not anwered, 1 is incorrect, 2 is correct
  }

  private async guessAnswer() {
    if (!(await this.gameContract.isStarted())) {
      throw new Error("Game not started");
    }

    if (!(await this.gameContract.isAnswerTurn())) {
      throw new Error("Only current player turn can answer");
    }

    const hash = await this.gameContract.hashByAccount();
    const guess = [
      (await this.gameContract.lastGuess(0)).toNumber(),
      (await this.gameContract.lastGuess(1)).toNumber(),
      (await this.gameContract.lastGuess(2)).toNumber(),
      (await this.gameContract.lastGuess(3)).toNumber(),
    ];

    // generate question proof
    const proof = await this.gameZK.guessProof(
      this.character,
      this.salt,
      guess,
      hash.toString()
    );
    const won = parseInt(proof.input[0]);

    const tx = await this.gameContract.isWon(
      won,
      proof.piA,
      proof.piB,
      proof.piC
    );
    await tx.wait();

    return won + 1;
  }
}

export function createGuessGame(
  game: Contract,
  boardZKFiles: ZKFiles,
  questionZKFiles: ZKFiles,
  guessZKFiles: ZKFiles,
  character: number[],
  salt: bigint | undefined = undefined
) {
  const gameZK: GameZK = new GameZK(
    boardZKFiles,
    questionZKFiles,
    guessZKFiles
  );

  if (salt) {
    return new GuessGame(game, gameZK, character, salt);
  }

  return new GuessGame(game, gameZK, character);
}

export const randomGenerator = function randomBigInt(): bigint {
  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  return BigInt(Math.floor(Math.random() * 10 ** 8));
};
