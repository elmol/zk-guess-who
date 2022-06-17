import { fail } from "assert";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  guessProof,
  questionProof,
  selectionProof,
  verifyGuess,
  verifyQuestion
} from "../game/game-zk";
import { createHash } from "../game/zk-utils";

const VALID_CHARACTER = [3, 2, 1, 0];

describe("Game ZK", function () {
  let verifier: any;
  let verifierBoard: any;

  beforeEach(async function () {
    const Verifier = await ethers.getContractFactory("VerifierGame");
    verifier = await Verifier.deploy();
    await verifier.deployed();

    const VerifierBoard = await ethers.getContractFactory("VerifierBoard");
    verifierBoard = await VerifierBoard.deploy();
    await verifierBoard.deployed();
  });

  it("should be able to generate character selection proof", async function () {
    // player should be able to select a character for this, a random salt will be generated,
    // and the hash after the proof generation will be sent to the other guesser player.

    const character = VALID_CHARACTER;
    const salt = 231;
    const selection = await selectionProof(character, salt);

    // asserts
    const hash = await createHash({ solutions: character, salt: salt });
    // output
    expect(selection.input[0]).to.equal(hash); // hash

    // public inputs
    expect(selection.input[1]).to.equal(hash); // hash

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
    const proofGenerator = selectionProof(character, salt);
    await assertProofGenerationFailed(proofGenerator);
  });

  it("should be able to proof a question correctly", async function () {
    // guesser player will make question about the characteristics of the character
    // selector player will generate a proof that the guesser player with the response (correct or not)
    // guesser player will verify the proof and validate the question

    // create a selection proof
    const character = VALID_CHARACTER;
    const salt = 231;
    const selection = await selectionProof(character, salt);

    // create a question proof
    const type = 2;
    const characteristic = 1;
    // is the characteristic type 2 of the character the 1 characteristic

    // selector player generate the proof to respond this question
    const hash = selection.input[0];
    const response = 1;

    const question = await questionProof(
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
    expect(question.input[1]).to.equal("0"); // guess[0]
    expect(question.input[2]).to.equal("0"); // guess[1]
    expect(question.input[3]).to.equal("0"); // guess[2]
    expect(question.input[4]).to.equal("0"); // guess[3]
    expect(question.input[5]).to.equal(type.toString()); // ask[0]
    expect(question.input[6]).to.equal(characteristic.toString()); // ask[1]
    expect(question.input[7]).to.equal(response.toString()); // ask[2]
    expect(question.input[8]).to.equal("0"); // win
    expect(question.input[9]).to.equal(hash); // hash

    // guesser player verify the proof
    const { isCorrect, questionReponse } = await verifyQuestion(
      question,
      verifier
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
    const selection = await selectionProof(character, salt);
    // selector player generate the proof to respond this question
    const hash = selection.input[0];

    // create a guess proof
    const guess = [3, 2, 1, 0]; // ok
    const win = 1;
    const proof = await guessProof(character, salt, guess, win, hash);

    // asserts
    // output
    expect(proof.input[0]).to.equal(hash); // hash

    // public inputs
    expect(proof.input[1]).to.equal(guess[0].toString()); // guess[0]
    expect(proof.input[2]).to.equal(guess[1].toString()); // guess[1]
    expect(proof.input[3]).to.equal(guess[2].toString()); // guess[2]
    expect(proof.input[4]).to.equal(guess[3].toString()); // guess[3]
    expect(proof.input[5]).to.equal("0"); // ask[0]
    expect(proof.input[6]).to.equal(character[0].toString()); // ask[1]
    expect(proof.input[7]).to.equal("1"); // ask[2]
    expect(proof.input[8]).to.equal(win.toString()); // ask[3] win
    expect(proof.input[9]).to.equal(hash); // hash

    // guesser player verify the proof
    const { isCorrect, guessResponse } = await verifyGuess(proof, verifier);

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
