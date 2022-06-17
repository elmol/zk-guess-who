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
      solHash: "", // public
    };
    input.solHash = await createHash(input);
    return await this.generateBoardProof(input);
  }

  async questionProof(
    character: number[],
    salt: number,
    type: number,
    characteristic: number,
    response: number,
    hash: any
  ) {
    const input = {
      solutions: character,
      salt: salt,
      ask: [type, characteristic, response],

      solHash: hash, // public hash
    };
    return await this.generateQuestionProof(input);
  }

  async guessProof(character: any, salt: any, guess: any, win: any, hash: any) {
    const input = {
      solutions: character,
      salt: salt,
      guess: guess,
      win: win,
      solHash: hash, // public hash
    };
    return await this.generateGuessProof(input);
  }

  // VERIFICATIONS
  async verifyGuess(question: any, verifier: any) {
    const guessResponse = question.input[5]; // response
    const isCorrect = await verifier.verifyProof(
      question.piA,
      question.piB,
      question.piC,
      question.input
    );
    return { isCorrect, guessResponse };
  }

  async verifyQuestion(question: any, verifier: any) {
    const questionReponse = question.input[3]; // response
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
