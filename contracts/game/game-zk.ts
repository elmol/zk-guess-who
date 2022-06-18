import { createHash, ZKUtils } from "./zk-utils";

export interface ZKFiles {
  wasm: string;
  zkey: string;
}

export class GameZK {
  private zkBoard: ZKUtils;
  private zkQuestion: ZKUtils;
  private zkGuess: ZKUtils;

  constructor(board: ZKFiles, question: ZKFiles, guess: ZKFiles) {
    this.zkBoard = new ZKUtils(board.wasm, board.zkey);
    this.zkQuestion = new ZKUtils(question.wasm, question.zkey);
    this.zkGuess = new ZKUtils(guess.wasm, guess.zkey);
  }

  // PROOFS GENERATIONS
  async selectionProof(character: any, salt: any) {
    const input = {
      solutions: character,
      salt: salt,
    };
    return await this.generateBoardProof(input);
  }

  async questionProof(
    character: number[],
    salt: bigint,
    type: number,
    characteristic: number,
    hash: any
  ) {
    const input = {
      solutions: character,
      salt: salt,
      ask: [type, characteristic],
      solHash: hash, // public hash
    };
    return await this.generateQuestionProof(input);
  }

  async guessProof(character: any, salt: any, guess: any, hash: any) {
    const input = {
      solutions: character,
      salt: salt,
      guess: guess,
      solHash: hash, // public hash
    };
    return await this.generateGuessProof(input);
  }

  // VERIFICATIONS
  async verifyGuess(question: any, verifier: any) {
    const guessResponse = question.input[0]; // response
    const isCorrect = await verifier.verifyProof(
      question.piA,
      question.piB,
      question.piC,
      question.input
    );
    return { isCorrect, guessResponse };
  }

  async verifyQuestion(question: any, verifier: any) {
    const questionReponse = question.input[0]; // response
    const isCorrect = (await verifier.verifyProof(
      question.piA,
      question.piB,
      question.piC,
      question.input
    )) as boolean;
    return { isCorrect, questionReponse };
  }

  async generateQuestionProof(input: any) {
    return await this.zkQuestion.generateProof(input);
  }

  async generateGuessProof(input: any) {
    return await this.zkGuess.generateProof(input);
  }

  async generateBoardProof(input: any) {
    return await this.zkBoard.generateProof(input);
  }
}
