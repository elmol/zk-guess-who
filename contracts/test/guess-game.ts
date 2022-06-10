import { Contract } from "ethers";
import { guessProof, questionProof, select } from "./game-service";

export class GuessGame {
  constructor(private game: Contract) {}

  async start(character: number[], salt: number): Promise<String> {
    const selection = await select(character, salt);
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

  async answer(character: number[], salt: number) {
    const type = await this.game.lastType();
    const characteristic = await this.game.lastCharacteristic();
    const response = character[type] === characteristic ? 1 : 0;

    // generate question proof
    const hash = await this.game.hash();
    const question = await questionProof(
      character,
      salt,
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

  async guessAnswer(character: number[], salt: number) {
    const hash = await this.game.hash();
    const guess = [
      (await this.game.lastGuess(0)).toNumber(),
      (await this.game.lastGuess(1)).toNumber(),
      (await this.game.lastGuess(2)).toNumber(),
      (await this.game.lastGuess(3)).toNumber(),
    ];
    const won = JSON.stringify(character) === JSON.stringify(guess) ? 1 : 0;

    // generate question proof
    const proof = await guessProof(
      character,
      salt,
      guess,
      won,
      hash.toString()
    );
    const tx = await this.game.isWon(won, proof.piA, proof.piB, proof.piC);
    await tx.wait();
    return won;
  }
}
