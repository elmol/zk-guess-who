import { Contract } from "ethers";
import { guessProof, questionProof, selectionProof } from "./game-zk";

export class GuessGame {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private game: Contract,
    private character: number[],
    private salt: number
  ) {}

  async start(): Promise<String> {
    const selection = await selectionProof(this.character, this.salt);
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
    const question = await questionProof(
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
    return response;
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
    const proof = await guessProof(
      this.character,
      this.salt,
      guess,
      won,
      hash.toString()
    );
    const tx = await this.game.isWon(won, proof.piA, proof.piB, proof.piC);
    await tx.wait();
    return won;
  }
}

export function createGuessGame(
  game: Contract,
  character: number[],
  salt: number
) {
  return new GuessGame(game, character, salt);
}
