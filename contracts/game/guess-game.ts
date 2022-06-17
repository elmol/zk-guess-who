import { Contract } from "ethers";
import { GameZK, ZKFiles } from "./game-zk";

export class GuessGame {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private game: Contract,
    private gameZK: GameZK,
    private character: number[],
    private salt: bigint = randomGenerator()
  ) {}

  async start(): Promise<String> {
    const selection = await this.gameZK.selectionProof(
      this.character,
      this.salt
    );
    const hash = selection.input[0];
    const tx = await this.game.start(
      hash,
      selection.piA,
      selection.piB,
      selection.piC
    );
    await tx.wait();
    return hash;
  }

  async question(type: number, characteristic: number) {
    const tx = await this.game.ask(type, characteristic);
    await tx.wait();
  }

  async answer() {
    const type = await this.game.lastType();
    const characteristic = await this.game.lastCharacteristic();
    const response = this.character[type] === characteristic ? 1 : 0;

    // generate question proof
    const hash = await this.game.hash();
    const question = await this.gameZK.questionProof(
      this.character,
      this.salt,
      type,
      characteristic,
      response,
      hash.toString()
    );

    const tx = await this.game.response(
      response,
      question.piA,
      question.piB,
      question.piC
    );
    await tx.wait();
    return response + 1; // 0 is not anwered, 1 is incorrect, 2 is correct
  }

  async guess(guess: number[]) {
    const tx = await this.game.guess(guess);
    await tx.wait();
  }

  async guessAnswer() {
    const hash = await this.game.hash();
    const guess = [
      (await this.game.lastGuess(0)).toNumber(),
      (await this.game.lastGuess(1)).toNumber(),
      (await this.game.lastGuess(2)).toNumber(),
      (await this.game.lastGuess(3)).toNumber(),
    ];
    const won =
      JSON.stringify(this.character) === JSON.stringify(guess) ? 1 : 0;

    // generate question proof
    const proof = await this.gameZK.guessProof(
      this.character,
      this.salt,
      guess,
      won,
      hash.toString()
    );

    const tx = await this.game.isWon(won, proof.piA, proof.piB, proof.piC);
    await tx.wait();
    return await this.game.won();
  }

  // on event handle
  onQuestionAsked(callback: (type: number, characteristic: number) => void) {
    this.game.on("QuestionAsked", callback);
  }

  onQuestionAnswered(callback: (answer: number) => void) {
    this.game.on("QuestionAnswered", callback);
  }

  onGuess(callback: (guess: number[]) => void) {
    this.game.on("Guess", callback);
  }

  onGuessResponse(callback: (answer: number) => void) {
    this.game.on("GuessResponse", callback);
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

const randomGenerator = function randomBigInt(): bigint {
  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  return BigInt(Math.floor(Math.random() * 10 ** 8));
};
