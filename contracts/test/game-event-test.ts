/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import { createGuessGame, GuessGame } from "../game/guess-game";
import { Game, Game__factory } from "../typechain";

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
describe("Game Event", function () {
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

  it("should emit event when question is answer", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    // guesser player fist ask
    // true question
    await player2Game.question(0, 3);

    const t = timeout(5000);
    let eventEmmited = false;
    gameContract.on("QuestionAnswered", (answer) => {
      expect(answer).to.equal(2);
      eventEmmited = true;
      t.cancel();
    });

    // selector player respond
    const response = await player1Game.answer();
    expect(response).to.equal(2);

    // wait until event
    await t.delay;
    expect(eventEmmited).to.equal(true);
  });

  it("should game allow to handle question asked event", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    const t = timeout(5000);
    let eventEmmited = false;
    const callback = (type: number, characteristic: number) => {
      expect(type).to.equal(0);
      expect(characteristic).to.equal(3);
      eventEmmited = true;
      t.cancel();
    };

    player1Game.onQuestionAsked(callback);
    await player2Game.question(0, 3);

    // wait until event
    await t.delay;
    expect(eventEmmited).to.equal(true);
  });

  it("should game allow to handle question answered event", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    await player2Game.question(0, 3);

    const t = timeout(8000);
    let eventEmmited = false;
    const callback = (answer: number) => {
      expect(answer).to.equal(2);
      eventEmmited = true;
      t.cancel();
    };

    player1Game.onQuestionAnswered(callback);
    await player1Game.answer();

    // wait until event
    await t.delay;
    expect(eventEmmited).to.equal(true);
  });

  it("should game allow to handle guess event", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    const t = timeout(5000);
    let eventEmmited = false;
    const callback = (guess: number[]) => {
      expect(guess[0]).to.equal(3);
      expect(guess[1]).to.equal(2);
      expect(guess[2]).to.equal(1);
      expect(guess[3]).to.equal(0);
      eventEmmited = true;
      t.cancel();
    };

    player1Game.onGuess(callback);
    await player2Game.guess([3, 2, 1, 0]);

    await t.delay;
    expect(eventEmmited).to.equal(true);
  });

  it("should game allow to handle guess response event", async function () {
    // initialize the game
    await player1Game.start();
    await player2Game.join();

    await player2Game.guess([3, 2, 1, 0]);

    const t = timeout(10000);
    let eventEmmited = false;
    const callback = (isWon: number) => {
      expect(isWon).to.equal(2);
      eventEmmited = true;
      t.cancel();
    };
    player1Game.onGuessResponse(callback);
    await player1Game.guessAnswer();

    await t.delay;
    expect(eventEmmited).to.equal(true);
  });

  it("should game allow to handle game joined event", async function () {
    // initialize the game
    await player1Game.start();
    const t = timeout(10000);
    let eventEmmited = false;
    const callback = () => {
      eventEmmited = true;
      t.cancel();
    };
    player2Game.onPlayerJoined(callback);
    await player2Game.join();


    await t.delay;
    expect(eventEmmited).to.equal(true);
  });

  it("should game allow to handle game created event", async function () {
    // initialize the game
    const t = timeout(10000);
    let eventEmmited = false;
    const callback = () => {
      eventEmmited = true;
      t.cancel();
    };
    player1Game.onGameCreated(callback);
    await player1Game.start();


    await t.delay;
    expect(eventEmmited).to.equal(true);
  });
});

// HELPERS
function timeout(ms: any) {
  let cancel = function () {};
  const delay = new Promise(function (resolve, reject) {
    const timeouts = setTimeout(function () {
      resolve("resolved");
    }, ms);

    cancel = function () {
      resolve("canceled");
      clearTimeout(timeouts); // We actually don't need to do this since we
    };
  });
  return { delay: delay, cancel: cancel };
}
