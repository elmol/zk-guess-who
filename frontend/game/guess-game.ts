import { Contract } from "ethers";
import { GameZK, ZKFiles } from "./game-zk";

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
