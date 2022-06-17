import { expect } from "chai";
import { ethers } from "hardhat";
import { Game, Game__factory } from "../typechain";
import { createGuessGame, GuessGame } from "../game/guess-game";

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
    const salt = 231;

    guessGame = createGuessGame(
      game,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      character,
      salt
    );
  });

  it("should allow to create a new game selecting a character", async function () {
    const character = VALID_CHARACTER;
    const salt = 231;
    guessGame = createGuessGame(
      game,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      character,
      salt
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

    // when the game is initialized, the last answer should be 0
    expect(await game.lastResponse()).to.equal(0);

    // guesser player first ask
    await guessGame.question(1, 3);

    // answer the question
    await guessGame.answer();

    expect(await game.lastResponse()).to.equal(1);
  });

  it("should set last answer 2 if the question is correct", async function () {
    // initialize the game
    await guessGame.start();

    // when the game is initialized, the last answer should be 0
    expect(await game.lastResponse()).to.equal(0);

    // guesser player first ask
    await guessGame.question(0, 3);

    // answer the question
    await guessGame.answer();

    expect(await game.lastResponse()).to.equal(2);
  });

  it("should the last answer be 0 if the question was not answered", async function () {
    // initialize the game
    await guessGame.start();

    // when the game is initialized, the last answer should be 0
    expect(await game.lastResponse()).to.equal(0);

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
    expect(await game.won()).to.equal(0);

    // guesser player first ask
    await guessGame.guess([0, 1, 2, 3]);

    // answer the question
    await guessGame.guessAnswer();

    expect(await game.won()).to.equal(1);
  });

  it("should set last guess response to  2 if it was guessed", async function () {
    // initialize the game
    await guessGame.start();

    // when the game is initialized, the last answer should be 0
    expect(await game.won()).to.equal(0);

    // guesser player first ask
    await guessGame.guess([3, 2, 1, 0]);

    // answer the question
    await guessGame.guessAnswer();

    expect(await game.won()).to.equal(2);
  });

  it("should set last guess response to 0 if is pending to respond", async function () {
    // initialize the game
    await guessGame.start();

    // when the game is initialized, the last answer should be 0
    expect(await game.won()).to.equal(0);

    // guesser player first ask
    await guessGame.guess([3, 2, 1, 0]);

    // answer the question
    await guessGame.guessAnswer();

    // guesser player first ask
    await guessGame.guess([1, 2, 1, 0]);

    expect(await game.won()).to.equal(0);
  });
});
