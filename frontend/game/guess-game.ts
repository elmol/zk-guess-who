import { Contract, ethers } from "ethers";
import { GameZK, ZKFiles } from "./game-zk";

export class GuessGame {
  // eslint-disable-next-line no-useless-constructor
  constructor(private game: Contract, private gameZK: GameZK, private character: number[], private salt: bigint = randomGenerator()) {}

  async start(): Promise<String> {
    // generating proof character selection
    const selection = await this.gameZK.selectionProof(this.character, this.salt);
    const hash = selection.input[0];

    // sending proof to contract
    const tx = await this.game.start(hash, selection.piA, selection.piB, selection.piC);
    await tx.wait();

    return hash;
  }

  async question(type: number, characteristic: number) {
    const tx = await this.game.ask(type, characteristic);
    await tx.wait();
  }

  async answer() {
    if (!(await this.game.isStarted())) {
      throw new Error("Game not started");
    }

    const type = await this.game.lastType();
    const characteristic = await this.game.lastCharacteristic();
    const hash = await this.game.hash();

    // generate question proof
    const question = await this.gameZK.questionProof(this.character, this.salt, type, characteristic, hash.toString());
    const answer = parseInt(question.input[0]);

    const tx = await this.game.response(answer, question.piA, question.piB, question.piC);
    await tx.wait();

    return answer + 1; // 0 is not anwered, 1 is incorrect, 2 is correct
  }

  async guess(guess: number[]) {
    const tx = await this.game.guess(guess);
    await tx.wait();
  }

  async guessAnswer() {
    if (!(await this.game.isStarted())) {
      throw new Error("Game not started");
    }

    const hash = await this.game.hash();
    const guess = [(await this.game.lastGuess(0)).toNumber(), (await this.game.lastGuess(1)).toNumber(), (await this.game.lastGuess(2)).toNumber(), (await this.game.lastGuess(3)).toNumber()];

    // generate question proof
    const proof = await this.gameZK.guessProof(this.character, this.salt, guess, hash.toString());
    const won = parseInt(proof.input[0]);

    const tx = await this.game.isWon(won, proof.piA, proof.piB, proof.piC);
    await tx.wait();

    return won + 1;
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

  connect(signer: any) {
    this.game = this.game.connect(signer);
  }

  async isStarted(): Promise<boolean> {
    return await this.game.isStarted();
  }
}

export function createGuessGame(game: Contract, boardZKFiles: ZKFiles, questionZKFiles: ZKFiles, guessZKFiles: ZKFiles, character: number[], salt: bigint | undefined = undefined) {
  const gameZK: GameZK = new GameZK(boardZKFiles, questionZKFiles, guessZKFiles);

  if (salt) {
    return new GuessGame(game, gameZK, character, salt);
  }

  return new GuessGame(game, gameZK, character);
}

const randomGenerator = function randomBigInt(): bigint {
  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  return BigInt(Math.floor(Math.random() * 10 ** 8));
};
