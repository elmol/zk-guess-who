import { fail } from "assert";
import { expect } from "chai";
import { ethers } from "hardhat";
import { GameZK } from "../game/game-zk";
import { createHash } from "../game/zk-utils";

const VALID_CHARACTER = [3, 2, 1, 0];

describe("Game ZK", function () {
  let verifierBoard: any;
  let verifierQuestion: any;
  let verifierGuess: any;

  const board = {
    wasm: "artifacts/circuits/board.wasm",
    zkey: "artifacts/circuits/circuit_final_board.zkey",
  };

  const questionZKFiles = {
    wasm: "artifacts/circuits/question.wasm",
    zkey: "artifacts/circuits/circuit_final_question.zkey",
  };

  const guessZKFiles = {
    wasm: "artifacts/circuits/guess.wasm",
    zkey: "artifacts/circuits/circuit_final_guess.zkey",
  };

  const gameZK: GameZK = new GameZK(board, questionZKFiles, guessZKFiles);

  beforeEach(async function () {
    const VerifierBoard = await ethers.getContractFactory("VerifierBoard");
    verifierBoard = await VerifierBoard.deploy();
    await verifierBoard.deployed();

    const VerifierQuestion = await ethers.getContractFactory(
      "VerifierQuestion"
    );
    verifierQuestion = await VerifierQuestion.deploy();
    await verifierQuestion.deployed();

    const VerifierGuess = await ethers.getContractFactory("VerifierGuess");
    verifierGuess = await VerifierGuess.deploy();
    await verifierGuess.deployed();
  });

  it("should be able to generate character selection proof", async function () {
    // player should be able to select a character for this, a random salt will be generated,
    // and the hash after the proof generation will be sent to the other guesser player.

    const character = VALID_CHARACTER;
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    const salt = BigInt(231);
    const selection = await gameZK.selectionProof(character, salt);

    // asserts
    const hash = await createHash({ solutions: character, salt: salt });
    // output
    expect(selection.input[0]).to.equal(hash); // hash

    // eslint-disable-next-line no-unused-expressions
    expect(
      await verifierBoard.verifyProof(
        selection.piA,
        selection.piB,
        selection.piC,
        selection.input
      )
    ).to.be.true;
  });

  it("should be not able to generate character selection proof is not in the board", async function () {
    const character = [3, 2, 1, 1]; // not in the board
    const salt = 231;
    const proofGenerator = gameZK.selectionProof(character, salt);
    await assertProofGenerationFailed(proofGenerator);
  });

  it("should be able to proof a question correctly", async function () {
    // guesser player will make question about the characteristics of the character
    // selector player will generate a proof that the guesser player with the response (correct or not)
    // guesser player will verify the proof and validate the question

    // create a selection proof
    const character = VALID_CHARACTER;
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    const salt = BigInt(231);
    const selection = await gameZK.selectionProof(character, salt);

    // create a question proof
    const type = 2;
    const characteristic = 1;
    // is the characteristic type 2 of the character the 1 characteristic

    // selector player generate the proof to respond this question
    const hash = selection.input[0];
    const response = 1;

    const question = await gameZK.questionProof(
      character,
      salt,
      type,
      characteristic,
      response,
      hash
    );

    // asserts
    // output
    expect(question.input[0]).to.equal(hash); // hash

    // public inputs
    expect(question.input[1]).to.equal(type.toString()); // ask[0]
    expect(question.input[2]).to.equal(characteristic.toString()); // ask[1]
    expect(question.input[3]).to.equal(response.toString()); // ask[2]
    expect(question.input[4]).to.equal(hash); // hash

    // guesser player verify the proof
    const { isCorrect, questionReponse } = await gameZK.verifyQuestion(
      question,
      verifierQuestion
    );
    expect(isCorrect).to.equal(true);
    expect(questionReponse).to.equal(response.toString());
  });

  it("should be able to proof a guess correctly", async function () {
    // guesser player will guess the character
    // selector player will generate a proof that the guesser player if guess or not
    // guesser player will verify the proof and validate the guess

    // create a selection proof
    const character = VALID_CHARACTER;
    const salt = 231;
    const selection = await gameZK.selectionProof(character, salt);
    // selector player generate the proof to respond this question
    const hash = selection.input[0];

    // create a guess proof
    const guess = [3, 2, 1, 0]; // ok
    const win = 1;
    const proof = await gameZK.guessProof(character, salt, guess, hash);

    // asserts
    // output
    expect(proof.input[0]).to.equal(win.toString()); // hash

    // public inputs
    expect(proof.input[1]).to.equal(guess[0].toString()); // guess[0]
    expect(proof.input[2]).to.equal(guess[1].toString()); // guess[1]
    expect(proof.input[3]).to.equal(guess[2].toString()); // guess[2]
    expect(proof.input[4]).to.equal(guess[3].toString()); // guess[3]
    expect(proof.input[5]).to.equal(hash); // ask[3] win

    // guesser player verify the proof
    const { isCorrect, guessResponse } = await gameZK.verifyGuess(
      proof,
      verifierGuess
    );

    // eslint-disable-next-line no-unused-expressions
    expect(isCorrect).to.be.true;
    expect(guessResponse).to.equal(win.toString());
  });
});

async function assertProofGenerationFailed(proofGenerator: any) {
  try {
    await proofGenerator;
    fail();
  } catch (error: any) {
    // eslint-disable-next-line no-unused-expressions
    expect(error.toString().includes("Assert Failed")).to.be.true;
  }
}

// async function assertionFailInProofGeneration(input: any) {
//   try {
//     await groth16.fullProve(
//       input,
//       "artifacts/circuits/game.wasm",
//       "artifacts/circuits/circuit_final_game.zkey"
//     );
//     fail();
//   } catch (error: any) {
//     expect(error.toString().includes("Assert Failed")).to.be.true;
//   }
// }
