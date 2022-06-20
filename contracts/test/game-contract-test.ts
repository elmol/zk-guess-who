/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import { Game, Game__factory } from "../typechain";
import { createGuessGame, GuessGame } from "../game/guess-game";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

const VALID_CHARACTER = [3, 2, 1, 0];
const VALID_PLAYER2_CHARACTER = [0, 1, 2, 3];

let player1Game: GuessGame;
let player2Game: GuessGame;

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
  let gameContract: Game;
  let creator: any;
  let guesser: any;

  beforeEach(async function () {
    // Contracts Deployment
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
    gameContract = await gameFactory.deploy(
      verifierBoard.address,
      verifierQuestion.address,
      verifierGuess.address
    );
    await gameContract.deployed();

    // Game Creation
    [creator, guesser] = await ethers.getSigners();

    const character = VALID_CHARACTER;
    const salt = BigInt(231);
    player1Game = createGuessGame(
      gameContract,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      character,
      salt
    );

    player2Game = createGuessGame(
      gameContract,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      VALID_PLAYER2_CHARACTER,
      BigInt(133)
    );
    player2Game.connect(guesser);
  });

  it("should allow to create a new game selecting a character", async function () {
    const hash = await player1Game.start();
    expect(await gameContract.hash()).to.equal(hash);
  });

  it("should allow to the guesser to ask a question", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // guesser player fist ask
    const type = 0;
    const characteristic = 1;
    await player2Game.question(type, characteristic);
    expect(await gameContract.lastType()).to.equal(0);
    expect(await gameContract.lastCharacteristic()).to.equal(1);

    // selector player respond
    const response = await player1Game.answer();
    expect(await gameContract.lastResponse()).to.equal(response);
  });

  it("should allow to guess the character", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // guess the solution
    const guess = [3, 2, 1, 0]; // solution
    await player2Game.guess(guess);

    expect(await gameContract.lastGuess(0)).to.equal(guess[0]);
    expect(await gameContract.lastGuess(1)).to.equal(guess[1]);
    expect(await gameContract.lastGuess(2)).to.equal(guess[2]);
    expect(await gameContract.lastGuess(3)).to.equal(guess[3]);

    // selector player respond
    const won = await player1Game.guessAnswer();
    expect(await gameContract.won()).to.equal(won);
  });

  // 0: not answered yet
  // 1: wrong answer
  // 2: correct answer
  it("should set last answer 1 if the question is wrong", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // when the game is initialized, the last answer should be 3
    expect(await gameContract.lastResponse()).to.equal(3);

    // guesser player first ask
    await player2Game.question(1, 3);

    // answer the question
    await player1Game.answer();

    expect(await gameContract.lastResponse()).to.equal(1);
  });

  it("should set last answer 2 if the question is correct", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // when the game is initialized, the last answer should be 3
    expect(await gameContract.lastResponse()).to.equal(3);

    // guesser player first ask
    await player2Game.question(0, 3);

    // answer the question
    await player1Game.answer();

    expect(await gameContract.lastResponse()).to.equal(2);
  });

  it("should the last answer be 0 if the question was not answered", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // when the game is initialized, the last answer should be 3
    expect(await gameContract.lastResponse()).to.equal(3);

    // guesser player first ask
    await player2Game.question(0, 3);
    expect(await gameContract.lastResponse()).to.equal(0);

    // answer the question
    await player1Game.answer();

    // true
    expect(await gameContract.lastResponse()).to.equal(2);

    // another question
    await player2Game.question(2, 3);
    // false
    expect(await gameContract.lastResponse()).to.equal(0);
  });

  // 0: not answered yet
  // 1: wrong answer
  // 2: correct answer
  it("should set last guess response to  1 if it was not guessed", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // // guesser player first ask
    // await guessGame.question(0, 3);

    // // answer the question
    // await guessGame.answer();

    // when the game is initialized, the last answer should be 0
    expect(await gameContract.won()).to.equal(3);

    // guesser player first ask
    await player2Game.guess([0, 1, 2, 3]);

    // answer the question
    await player1Game.guessAnswer();

    expect(await gameContract.won()).to.equal(1);
  });

  it("should set last guess response to  2 if it was guessed", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // when the game is initialized, the last answer should be 3
    expect(await gameContract.won()).to.equal(3);

    // guesser player first ask
    await player2Game.guess([3, 2, 1, 0]);

    // answer the question
    await player1Game.guessAnswer();

    expect(await gameContract.won()).to.equal(2);
  });

  it("should set last guess response to 0 if is pending to respond", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // when the game is initialized, the last answer should be 3
    expect(await gameContract.won()).to.equal(3);

    // guesser player first ask
    await player2Game.guess([3, 2, 1, 0]);

    // answer the question
    await player1Game.guessAnswer();

    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // guesser player first ask
    await player2Game.guess([1, 2, 1, 0]);

    expect(await gameContract.won()).to.equal(0);
  });

  it("should allow to configure salt generator as random", async () => {
    const character = VALID_CHARACTER;

    const randomGameSalt = createGuessGame(
      gameContract,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      character
    );

    // initialize the game
    await randomGameSalt.start();
    await player2Game.join();

    // answer the question
    await randomGameSalt.guessAnswer();

    expect(await gameContract.won()).to.equal(1);
  });

  it("should not allow to create a game if is already created", async () => {
    // initialize the game
    await player1Game.start();

    await expect(player1Game.start()).to.be.revertedWith(
      "Game already created"
    );
  });

  it("should not allow to ask a question if is not started", async () => {
    await expect(player1Game.question(1, 3)).to.be.revertedWith(
      "Game not started"
    );
  });

  it("should not allow to answer a question if is not started", async () => {
    await expect(player1Game.answer()).to.be.rejectedWith("Game not started");
  });

  it("should not allow to guess if is not started", async () => {
    await expect(player1Game.guess([1, 2, 3, 0])).to.be.revertedWith(
      "Game not started"
    );
  });

  it("should not allow to answer a guess if is not started", async () => {
    await expect(player1Game.guessAnswer()).to.be.rejectedWith(
      "Game not started"
    );
  });

  it("should only the creator can respond to a guess", async () => {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // connect with guesser
    await expect(player2Game.guessAnswer()).to.be.rejectedWith(
      "Only game creator can answer"
    );
  });

  it("should only the creator can respond to a question", async () => {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // connect with guesser
    await expect(player2Game.answer()).to.be.rejectedWith(
      "Only game creator can answer"
    );
  });

  it("should not ask a question if is pending of answer", async () => {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    await player1Game.question(1, 3);
    await expect(player1Game.question(2, 1)).to.be.revertedWith(
      "Question is pending of answer"
    );
  });

  it("should not guess if is pending of guess answer", async () => {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    await player1Game.guess([1, 2, 3, 0]);
    await expect(player1Game.guess([1, 2, 3, 4])).to.be.revertedWith(
      "Guess is pending of answer"
    );
  });

  it("it should finish the game after guess response", async () => {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    await player1Game.guess([1, 2, 3, 0]);
    await player1Game.guessAnswer();

    expect(await gameContract.isStarted()).to.be.equal(false);
  });

  it("it should return true if signer is the creator", async () => {
    // initialize the game
    await player1Game.start();

    expect(await player1Game.isGameCreator()).to.be.equal(true);
  });

  it("it should return false if signer is not the creator", async () => {
    // initialize the game
    await player1Game.start();
    // connect with guesser
    player1Game.connect(guesser);
    expect(await player1Game.isGameCreator()).to.be.equal(false);
  });

  it("should not allow to join if the game is full", async () => {
    // initialize the game
    await player1Game.start();

    // connect with guesser
    player1Game.connect(guesser);
  });

  it("should not allow to question if the player 2 is not join", async () => {
    // initialize the game
    await player1Game.start();

    // connect with guesser
    player1Game.connect(guesser);

    await expect(player1Game.question(1, 3)).to.be.revertedWith(
      "Player 2 is not join"
    );
  });

  it("should player 1 to join a game if the game is not created yet", async () => {
    // initialize the game
    await player1Game.start();

    // expect player 1 is the creator of the game
    expect(await gameContract.players(0)).to.be.equal(creator.address);
  });

  it("should not allow to join a game if the room is full", async () => {
    // initialize the game
    await player1Game.start();

    const guesserGame = createGuessGame(
      gameContract,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      [0, 1, 2, 3]
    );
    // connect with guesser
    guesserGame.connect(guesser);
    await guesserGame.join();

    await expect(guesserGame.join()).to.be.revertedWith(
      "Game Room already full"
    );
  });

  it("should player 2 to join a game if the game is not created yet", async () => {
    // initialize the game
    await player1Game.start();

    const guesserGame = createGuessGame(
      gameContract,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      [0, 1, 2, 3]
    );
    // connect with guesser
    guesserGame.connect(guesser);
    await guesserGame.join();

    // expect player 1 is the creator of the game
    expect(await gameContract.players(1)).to.be.equal(guesser.address);
  });

  it("should not allow to join a game if the game was not created", async () => {
    const guesserGame = createGuessGame(
      gameContract,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      [0, 1, 2, 3]
    );
    // connect with guesser
    guesserGame.connect(guesser);

    await expect(guesserGame.join()).to.be.revertedWith("Game not started");
  });

  it("should free the room when game finished", async () => {
    // initialize the game
    await player1Game.start();

    const guesserGame = createGuessGame(
      gameContract,
      boardZKFiles,
      questionZKFiles,
      guessZKFiles,
      [0, 1, 2, 3]
    );
    // connect with guesser
    guesserGame.connect(guesser);
    await guesserGame.join();

    await guesserGame.guess([1, 2, 3, 0]);
    await player1Game.guessAnswer();

    expect(await gameContract.isStarted()).to.be.equal(false);

    // allow to start a new game
    await player1Game.start();
    await guesserGame.join();
  });
});
