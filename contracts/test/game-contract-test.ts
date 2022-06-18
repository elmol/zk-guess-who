/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import { Game, Game__factory } from "../typechain";
import { createGuessGame, GuessGame } from "../game/guess-game";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

const VALID_CHARACTER = [3, 2, 1, 0];
let guessGame: GuessGame;
const boardZKFiles = {
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

describe("Game Contract", function () {
  let game: Game;
  let creator: any;
  let guesser: any;

  beforeEach(async function () {
    const VerifierBoard = await ethers.getContractFactory("VerifierBoard");
    const verifierBoard = await VerifierBoard.deploy();
    await verifierBoard.deployed();

    const VerifierQuestion = await ethers.getContractFactory(
      "VerifierQuestion"
    );
    const verifierQuestion = await VerifierQuestion.deploy();
    await verifierQuestion.deployed();

    const VerifierGuess = await ethers.getContractFactory("VerifierGuess");
    const verifierGuess = await VerifierGuess.deploy();
    await verifierGuess.deployed();

    const gameFactory = (await ethers.getContractFactory(
      "Game"
      // eslint-disable-next-line camelcase
    )) as Game__factory;
    game = await gameFactory.deploy(
      verifierBoard.address,
      verifierQuestion.address,
      verifierGuess.address
    );
    await game.deployed();

    const character = VALID_CHARACTER;
    const salt = BigInt(231);

    guessGame = createGuessGame(
      game,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      character,
      salt
    );

    [creator, guesser] = await ethers.getSigners();
  });

  it("should allow to create a new game selecting a character", async function () {
    const character = VALID_CHARACTER;
    guessGame = createGuessGame(
      game,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      character
    );
    const hash = await guessGame.start();
    expect(await game.hash()).to.equal(hash);
  });

  it("should allow to the guesser to ask a question", async function () {
    // initialize the game
    await guessGame.start();

    // guesser player fist ask
    const type = 0;
    const characteristic = 1;
    await guessGame.question(type, characteristic);
    expect(await game.lastType()).to.equal(0);
    expect(await game.lastCharacteristic()).to.equal(1);

    // selector player respond
    const response = await guessGame.answer();
    expect(await game.lastResponse()).to.equal(response);
  });

  it("should allow to guess the character", async function () {
    // initialize the game
    await guessGame.start();

    // guess the solution
    const guess = [3, 2, 1, 0]; // solution
    await guessGame.guess(guess);

    expect(await game.lastGuess(0)).to.equal(guess[0]);
    expect(await game.lastGuess(1)).to.equal(guess[1]);
    expect(await game.lastGuess(2)).to.equal(guess[2]);
    expect(await game.lastGuess(3)).to.equal(guess[3]);

    // selector player respond
    const won = await guessGame.guessAnswer();
    expect(await game.won()).to.equal(won);
  });

  it("should emit event when question is asked", async function () {
    // initialize the game
    await guessGame.start();

    // guesser player fist ask
    await expect(game.ask(0, 3)).to.emit(game, "QuestionAsked").withArgs(0, 3);
  });

  // 0: not answered yet
  // 1: wrong answer
  // 2: correct answer

  it("should set last answer 1 if the question is wrong", async function () {
    // initialize the game
    await guessGame.start();

    // when the game is initialized, the last answer should be 3
    expect(await game.lastResponse()).to.equal(3);

    // guesser player first ask
    await guessGame.question(1, 3);

    // answer the question
    await guessGame.answer();

    expect(await game.lastResponse()).to.equal(1);
  });

  it("should set last answer 2 if the question is correct", async function () {
    // initialize the game
    await guessGame.start();

    // when the game is initialized, the last answer should be 3
    expect(await game.lastResponse()).to.equal(3);

    // guesser player first ask
    await guessGame.question(0, 3);

    // answer the question
    await guessGame.answer();

    expect(await game.lastResponse()).to.equal(2);
  });

  it("should the last answer be 0 if the question was not answered", async function () {
    // initialize the game
    await guessGame.start();

    // when the game is initialized, the last answer should be 3
    expect(await game.lastResponse()).to.equal(3);

    // guesser player first ask
    await guessGame.question(0, 3);
    expect(await game.lastResponse()).to.equal(0);

    // answer the question
    await guessGame.answer();

    // true
    expect(await game.lastResponse()).to.equal(2);

    // another question
    await guessGame.question(2, 3);
    // false
    expect(await game.lastResponse()).to.equal(0);
  });

  // 0: not answered yet
  // 1: wrong answer
  // 2: correct answer
  it("should set last guess response to  1 if it was not guessed", async function () {
    // initialize the game
    await guessGame.start();

    // // guesser player first ask
    // await guessGame.question(0, 3);

    // // answer the question
    // await guessGame.answer();

    // when the game is initialized, the last answer should be 0
    expect(await game.won()).to.equal(3);

    // guesser player first ask
    await guessGame.guess([0, 1, 2, 3]);

    // answer the question
    await guessGame.guessAnswer();

    expect(await game.won()).to.equal(1);
  });

  it("should set last guess response to  2 if it was guessed", async function () {
    // initialize the game
    await guessGame.start();

    // when the game is initialized, the last answer should be 3
    expect(await game.won()).to.equal(3);

    // guesser player first ask
    await guessGame.guess([3, 2, 1, 0]);

    // answer the question
    await guessGame.guessAnswer();

    expect(await game.won()).to.equal(2);
  });

  it("should set last guess response to 0 if is pending to respond", async function () {
    // initialize the game
    await guessGame.start();

    // when the game is initialized, the last answer should be 3
    expect(await game.won()).to.equal(3);

    // guesser player first ask
    await guessGame.guess([3, 2, 1, 0]);

    // answer the question
    await guessGame.guessAnswer();

    // guesser player first ask
    await guessGame.guess([1, 2, 1, 0]);

    expect(await game.won()).to.equal(0);
  });

  it("should allow to configure salt generator as random", async () => {
    const character = VALID_CHARACTER;

    const randomGameSalt = createGuessGame(
      game,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      character
    );

    // initialize the game
    await randomGameSalt.start();

    // answer the question
    await randomGameSalt.guessAnswer();

    expect(await game.won()).to.equal(1);
  });

  it("should not allow to create a game if is already created", async () => {
    // initialize the game
    await guessGame.start();

    await expect(guessGame.start()).to.be.revertedWith("Game already created");
  });

  it("should not allow to ask a question if is not started", async () => {
    await expect(guessGame.question(1, 3)).to.be.revertedWith(
      "Game not started"
    );
  });

  it("should not allow to answer a question if is not started", async () => {
    await expect(guessGame.answer()).to.be.rejectedWith("Game not started");
  });

  it("should not allow to guess if is not started", async () => {
    await expect(guessGame.guess([1, 2, 3, 4])).to.be.revertedWith(
      "Game not started"
    );
  });

  it("should not allow to answer a guess if is not started", async () => {
    await expect(guessGame.guessAnswer()).to.be.rejectedWith(
      "Game not started"
    );
  });

  it("should only the creator can respond to a guess", async () => {
    // initialize the game
    await guessGame.start();

    // connect with guesser
    guessGame.connect(guesser);
    await expect(guessGame.guessAnswer()).to.be.rejectedWith(
      "Only creator can call this function"
    );
  });

  it("should only the creator can respond to a question", async () => {
    // initialize the game
    await guessGame.start();

    // connect with guesser
    guessGame.connect(guesser);
    await expect(guessGame.answer()).to.be.rejectedWith(
      "Only creator can call this function"
    );
  });

  it("should not ask a question if is pending of answer", async () => {
    // initialize the game
    await guessGame.start();

    await guessGame.question(1, 3);
    await expect(guessGame.question(2, 1)).to.be.revertedWith(
      "Question is pending of answer"
    );
  });

  it("should not guess if is pending of guess answer", async () => {
    // initialize the game
    await guessGame.start();

    await guessGame.guess([1, 2, 3, 4]);
    await expect(guessGame.guess([1, 2, 3, 4])).to.be.revertedWith(
      "Guess is pending of answer"
    );
  });
});
