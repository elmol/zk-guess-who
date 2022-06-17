import { createHash, ZKUtils } from "./zk-utils";

export interface ZKFiles {
  wasm: string;
  zkey: string;
}

export class GameZK {
  private zkBoard: ZKUtils;
  private zkGame: ZKUtils;

  constructor(board: ZKFiles, game: ZKFiles) {
    this.zkBoard = new ZKUtils(board.wasm, board.zkey);
    this.zkGame = new ZKUtils(game.wasm, game.zkey);
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

      guess: [0, 0, 0, 0],
      win: 0,
      solHash: hash, // public hash
    };
    const question = await this.generateGameProof(input);
    return question;
  }

  async guessProof(character: any, salt: any, guess: any, win: any, hash: any) {
    const input = {
      solutions: character,
      salt: salt,
      ask: [0, character[0], 1],

      guess: guess,
      win: win,
      solHash: hash, // public hash
    };
    return await this.generateGameProof(input);
  }

  // VERIFICATIONS
  async verifyGuess(question: any, verifier: any) {
    const guessResponse = question.input[8]; // response
    const isCorrect = await verifier.verifyProof(
      question.piA,
      question.piB,
      question.piC,
      question.input
    );
    return { isCorrect, guessResponse };
  }

  async verifyQuestion(question: any, verifier: any) {
    const questionReponse = question.input[7]; // response
    const isCorrect = (await verifier.verifyProof(
      question.piA,
      question.piB,
      question.piC,
      question.input
    )) as boolean;
    return { isCorrect, questionReponse };
  }

  async generateGameProof(input: any) {
    return await this.zkGame.generateProof(input);
  }

  async generateBoardProof(input: any) {
    return await this.zkBoard.generateProof(input);
  }
}
