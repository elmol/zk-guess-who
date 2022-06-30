/* eslint-disable node/no-unsupported-features/es-builtins */
import * as chai from "chai";
import { expect, should } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { createGuessGame, GuessGame } from "../game/guess-game";
import { Game, Game__factory } from "../typechain";

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
  let other: any;

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
    [creator, guesser, other] = await ethers.getSigners();

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

  it("should allow to create a new game", async function () {
    const hash = await player1Game.createOrJoin();
    expect(await gameContract.hash(0)).to.equal(hash);
  });

  it("should allow to ask a question", async function () {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    // guesser player fist ask
    const type = 0;
    const characteristic = 1;
    await player2Game.question(type, characteristic);
    expect(await gameContract.lastType()).to.equal(0);
    expect(await gameContract.lastCharacteristic()).to.equal(1);

    // selector player respond
    const response = await player1Game.answerAll();
    expect(await gameContract.lastResponse()).to.equal(response);
  });

  it("should allow to guess the character", async function () {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    // guess the solution
    const guess = [3, 2, 1, 0]; // solution
    await player2Game.guess(guess);

    expect(await gameContract.lastGuess(0)).to.equal(guess[0]);
    expect(await gameContract.lastGuess(1)).to.equal(guess[1]);
    expect(await gameContract.lastGuess(2)).to.equal(guess[2]);
    expect(await gameContract.lastGuess(3)).to.equal(guess[3]);

    // selector player respond
    const won = await player1Game.answerAll();
    expect(await gameContract.won()).to.equal(won);
  });

  // 0: not answered yet
  // 1: wrong answer
  // 2: correct answer
  it("should set last answer 1 if the question is wrong", async function () {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    // when the game is initialized, the last answer should be 3
    expect(await gameContract.lastResponse()).to.equal(3);

    // guesser player first ask
    await player2Game.question(1, 3);

    // answer the question
    await player1Game.answerAll();

    expect(await gameContract.lastResponse()).to.equal(1);
  });

  it("should set last answer 2 if the question is correct", async function () {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    // when the game is initialized, the last answer should be 3
    expect(await gameContract.lastResponse()).to.equal(3);

    // guesser player first ask
    await player2Game.question(0, 3);

    // answer the question
    await player1Game.answerAll();

    expect(await gameContract.lastResponse()).to.equal(2);
  });

  it("should the last answer be 0 if the question was not answered", async function () {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    // when the game is initialized, the last answer should be 3
    expect(await gameContract.lastResponse()).to.equal(3);

    // guesser player first ask
    await player2Game.question(0, 3);
    expect(await gameContract.lastResponse()).to.equal(0);

    // answer the question
    await player1Game.answerAll();

    // true
    expect(await gameContract.lastResponse()).to.equal(2);

    // another question
    await player1Game.question(2, 3);
    // false
    expect(await gameContract.lastResponse()).to.equal(0);
  });

  // 0: not answered yet
  // 1: wrong answer
  // 2: correct answer
  it("should set last guess response to  1 if it was not guessed", async function () {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    // // guesser player first ask
    // await guessGame.question(0, 3);

    // // answer the question
    // await guessGame.answerAll();

    // when the game is initialized, the last answer should be 0
    expect(await gameContract.won()).to.equal(3);

    // guesser player first ask
    await player2Game.guess([0, 1, 2, 3]);

    // answer the question
    await player1Game.answerAll();

    expect(await gameContract.won()).to.equal(1);
  });

  it("should set last guess response to  2 if it was guessed", async function () {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    // when the game is initialized, the last answer should be 3
    expect(await gameContract.won()).to.equal(3);

    // guesser player first ask
    await player2Game.guess([3, 2, 1, 0]);

    // answer the question
    await player1Game.answerAll();

    expect(await gameContract.won()).to.equal(2);
  });

  it("should set last guess response to 0 if is pending to respond", async function () {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    // when the game is initialized, the last answer should be 3
    expect(await gameContract.won()).to.equal(3);

    // guesser player first ask
    await player2Game.guess([3, 2, 1, 0]);

    // answer the question
    await player1Game.answerAll();

    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

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
    await randomGameSalt.createOrJoin();
    await player2Game.createOrJoin();

    // answer the question
    await player2Game.guess([1, 2, 1, 0]);
    await randomGameSalt.answerAll();

    expect(await gameContract.won()).to.equal(1);
  });

  it("should not allow to ask a question if is not started", async () => {
    await expect(player1Game.question(1, 3)).to.be.revertedWith(
      "Game not started"
    );
  });

  it("should not allow to answer a question if is not started", async () => {
    await expect(player1Game.answerAll()).to.be.rejectedWith(
      "Game not started"
    );
  });

  it("should not allow to guess if is not started", async () => {
    await expect(player1Game.guess([1, 2, 3, 0])).to.be.revertedWith(
      "Game not started"
    );
  });

  it("should not allow to answer a guess if is not started", async () => {
    await expect(player1Game.answerAll()).to.be.rejectedWith(
      "Game not started"
    );
  });

  it("should only the turn answer player can respond to a guess", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    // connect with guesser
    await player2Game.guess([1, 2, 1, 2]);
    await expect(player2Game.answerAll()).to.be.rejectedWith(
      "Only current player turn can answer"
    );
  });

  it("should only the turn answer player can respond to a question", async () => {
    // initialize the game
    await player2Game.createOrJoin();
    await player1Game.createOrJoin();

    // connect with guesser
    await player1Game.question(1, 3);
    await expect(player1Game.answerAll()).to.be.rejectedWith(
      "Only current player turn can answer"
    );
  });

  it("should not ask a question if is pending of answer", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.question(1, 3);
    await expect(player2Game.question(2, 1)).to.be.revertedWith(
      "Question is pending of answer"
    );
  });

  it("should not guess if is pending of guess answer", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.guess([1, 2, 3, 0]);
    await expect(player2Game.guess([1, 2, 3, 4])).to.be.revertedWith(
      "Guess is pending of answer"
    );
  });

  it("it should finish the game after guess response", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.guess([1, 2, 3, 0]);
    await player1Game.answerAll();

    expect(await gameContract.isStarted()).to.be.equal(false);
  });

  it("it should return true if signer is the creator", async () => {
    // initialize the game
    await player1Game.createOrJoin();

    expect(await player1Game.isAnswerTurn()).to.be.equal(true);
  });

  it("it should return false if signer is not the creator", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    // connect with guesser
    player1Game.connect(guesser);
    expect(await player1Game.isAnswerTurn()).to.be.equal(false);
  });

  it("should not allow to join if the game is full", async () => {
    // initialize the game
    await player1Game.createOrJoin();

    // connect with guesser
    player1Game.connect(guesser);
  });

  it("should not allow to question if the player 2 is not join", async () => {
    // initialize the game
    await player1Game.createOrJoin();

    // connect with guesser
    player1Game.connect(guesser);

    await expect(player1Game.question(1, 3)).to.be.revertedWith(
      "Player 2 is not join"
    );
  });

  it("should player 1 to join a game if the game is not created yet", async () => {
    // initialize the game
    await player1Game.createOrJoin();

    // expect player 1 is the creator of the game
    expect(await gameContract.players(0)).to.be.equal(creator.address);
  });

  it("should not allow to join a game if the room is full", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();
    await player2Game.connect(other);
    await expect(player2Game.createOrJoin()).to.be.rejectedWith(
      "Game Room already full"
    );
  });

  it("should player 2 to join a game if the game is not created yet", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    // expect player 1 is the creator of the game
    expect(await gameContract.players(1)).to.be.equal(guesser.address);
  });

  it("should free the room when game finished", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.guess([1, 2, 3, 0]);
    await player1Game.answerAll();

    expect(await gameContract.isStarted()).to.be.equal(false);

    // allow to start a new game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();
    expect(await gameContract.winner()).to.equal(ethers.constants.AddressZero);
  });

  it("should is ready to join true if the game was created but not joined", async () => {
    // initialize the game
    await player1Game.createOrJoin();

    expect(await gameContract.isCreated()).to.be.equal(true);
  });

  it("should not allow to start or join if the game was started", async () => {
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await expect(player2Game.createOrJoin()).to.be.rejectedWith(
      "Game Room already full"
    );
  });

  it("should not allow to join the same player who create the game", async () => {
    await player1Game.createOrJoin();
    await expect(player1Game.createOrJoin()).to.be.rejectedWith(
      "Player already join"
    );
  });

  it("should player 2 to question answer when is its turn", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.question(1, 3);
    await player1Game.answerAll();

    expect(await gameContract.lastResponse()).to.equal(1);

    await player1Game.question(1, 1);
    await player2Game.answerAll();
    expect(await gameContract.lastResponse()).to.equal(2);
  });

  it("should player 2 to guess answer when is its turn", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.question(1, 3);
    await player1Game.answerAll();

    expect(await gameContract.lastResponse()).to.equal(1);

    await player1Game.guess([0, 1, 2, 3]);
    await player2Game.answerAll();
    expect(await gameContract.won()).to.equal(2);
  });

  it("should winner player 2 when player 2 guess the character", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.guess([3, 2, 1, 0]);
    await player1Game.answerAll();

    expect(await gameContract.winner()).to.equal(guesser.address);
  });

  it("should winner player 1 when player 2 not guess the character", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.guess([0, 2, 1, 0]);
    await player1Game.answerAll();

    expect(await gameContract.winner()).to.equal(creator.address);
  });

  it("should winner player 1 when player 1 guess the character", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.question(1, 3);
    await player1Game.answerAll();

    await player1Game.guess([0, 1, 2, 3]);
    await player2Game.answerAll();

    expect(await gameContract.winner()).to.equal(creator.address);
  });

  it("should answer all (question and guess) on the same time", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.question(1, 3);
    await player1Game.answerAll();
    expect(await gameContract.lastResponse()).to.equal(1);

    await player1Game.question(1, 1);
    await player2Game.answerAll();
    expect(await gameContract.lastResponse()).to.equal(2);

    await player2Game.guess([3, 2, 1, 0]);
    await player1Game.answerAll();
    expect(await gameContract.winner()).to.equal(guesser.address);
    expect(await gameContract.won()).to.equal(2);
    expect(await gameContract.connect(guesser).isWinner()).to.equal(true);
  });

  it("should not to allow answer all if not a pending answer (guess or question)", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await expect(player1Game.answerAll()).to.be.rejectedWith(
      "No answer pending"
    );

    await player2Game.question(1, 3);
    await player1Game.answerAll();
    expect(await gameContract.lastResponse()).to.equal(1);

    await expect(player2Game.answerAll()).to.be.rejectedWith(
      "No answer pending"
    );

    await player1Game.question(1, 1);
    await player2Game.answerAll();
    expect(await gameContract.lastResponse()).to.equal(2);

    await player2Game.guess([3, 2, 1, 0]);
    await player1Game.answerAll();
    expect(await gameContract.winner()).to.equal(guesser.address);
    expect(await gameContract.won()).to.equal(2);

    await expect(player1Game.answerAll()).to.be.rejectedWith(
      "No answer pending"
    );
  });

  it("should not allow to guess if there is a pending question", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.question(1, 3);
    await expect(player2Game.guess([3, 2, 1, 0])).to.be.rejectedWith(
      "Pending question answer"
    );
  });

  it("should not allow to question if there is a pending guess", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.guess([3, 2, 1, 0]);
    await expect(player2Game.question(1, 3)).to.be.rejectedWith(
      "Pending guess answer"
    );
  });

  it("should not allow to question if is not the turn", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await expect(player1Game.question(1, 3)).to.be.rejectedWith(
      "Not player turn"
    );
  });

  it("should not allow to guess if is not the turn", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await expect(player1Game.guess([3, 2, 1, 0])).to.be.rejectedWith(
      "Not player turn"
    );
  });

  it("should not allow to guess player 2 if is not the turn", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.question(1, 3);
    await player1Game.answerAll();

    await expect(player2Game.guess([3, 2, 1, 0])).to.be.rejectedWith(
      "Not player turn"
    );
  });

  it("should not allow to question player 2 if is not the turn", async () => {
    // initialize the game
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();

    await player2Game.question(1, 3);
    await player1Game.answerAll();

    await expect(player2Game.question(1, 3)).to.be.rejectedWith(
      "Not player turn"
    );
  });

  it("should return true if the player is in game", async () => {
    expect(await player1Game.isPlayerInGame()).to.equal(false);
    await player1Game.createOrJoin();
    expect(await player1Game.isPlayerInGame()).to.equal(true);
    expect(await player2Game.isPlayerInGame()).to.equal(false);
    await player2Game.createOrJoin();
    expect(await player2Game.isPlayerInGame()).to.equal(true);
  });

  it("should be able to reset by the owner to free room", async () => {
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();
    await gameContract.reset();
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();
  });

  it("should be able to quit the game by a player", async () => {
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();
    await player2Game.quit();
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();
  });

  it("should be rejected to quit if is not a player", async () => {
    await player1Game.createOrJoin();
    await player2Game.createOrJoin();
    player2Game.connect(other); // other
    await expect(player2Game.quit()).to.be.rejectedWith(
      "Only owner or players can reset"
    );
  });

  it("Should be able to load a game", async () => {
    const storage = new MockStorage();

    await player1Game.save(storage);
    const gameLoaded = GuessGame.loadDataByAccount(storage, creator.address);

    expect(gameLoaded?.character).to.deep.equal([3, 2, 1, 0]);
    expect(gameLoaded?.salt).to.equal(BigInt(231));
  });

  it("Should be playing flag flag if is not playing", async () => {
    const storage = new MockStorage();
    expect(GuessGame.isStoredPlaying(storage, creator.address)).to.equal(false);
  });

  it("Should throw error on loading an not existent game", async () => {
    const storage = new MockStorage();
    const gameLoaded = GuessGame.loadDataByAccount(storage, creator.address);
    expect(gameLoaded).to.equal(undefined);

    await expect(
      GuessGame.load(storage, creator.address, async (character, salt) => {
        return createGuessGame(
          gameContract,
          boardZKFiles,
          questionZKFiles,
          guessZKFiles,
          character,
          salt
        );
      })
    ).to.rejectedWith("Game not found");
  });

  it("Should be able load a new game if exist in storage", async () => {
    const storage = new MockStorage();
    await GuessGame.create(storage, [0, 1, 2, 3], async (character, salt) => {
      return createGuessGame(
        gameContract,
        boardZKFiles,
        questionZKFiles,
        guessZKFiles,
        character,
        salt
      );
    });
    const result = GuessGame.loadDataByAccount(storage, creator.address);

    const loadedGame = await GuessGame.load(
      storage,
      creator.address,
      async (character, salt) => {
        return createGuessGame(
          gameContract,
          boardZKFiles,
          questionZKFiles,
          guessZKFiles,
          character,
          salt // loaded form storage
        );
      }
    );

    const resultLoad = GuessGame.loadDataByAccount(storage, creator.address);
    expect(result?.character).to.deep.equal([0, 1, 2, 3]);
    // eslint-disable-next-line no-unused-expressions
    expect(result?.salt).to.equal(resultLoad?.salt);
    // eslint-disable-next-line no-unused-expressions
    expect(loadedGame).to.be.not.undefined;
  });

  it("Should be able to create new fresh game when there is not game", async () => {
    const storage = new MockStorage();
    const gameLoaded = GuessGame.loadDataByAccount(storage, creator.address);
    expect(gameLoaded).to.equal(undefined);
    // is playing should be false
    expect(GuessGame.isStoredPlaying(storage, creator.address)).to.equal(false);

    const newGame = await GuessGame.create(
      storage,
      [0, 1, 2, 3],
      async (character, salt) => {
        return createGuessGame(
          gameContract,
          boardZKFiles,
          questionZKFiles,
          guessZKFiles,
          character,
          salt
        );
      }
    );
    const result = GuessGame.loadDataByAccount(storage, creator.address);
    expect(result?.character).to.deep.equal([0, 1, 2, 3]);
    // eslint-disable-next-line no-unused-expressions
    expect(result?.salt).to.be.not.undefined;
    // eslint-disable-next-line no-unused-expressions
    expect(newGame).to.be.not.undefined;

    expect(GuessGame.isStoredPlaying(storage, creator.address)).to.equal(true);
  });

  it("Should be able to create new fresh game when last was finished", async () => {
    const storage = new MockStorage();

    // create a fresh game for player 1
    player1Game = await GuessGame.create(
      storage,
      [0, 1, 2, 3],
      async (character, salt) => {
        return createGuessGame(
          gameContract,
          boardZKFiles,
          questionZKFiles,
          guessZKFiles,
          character,
          salt
        );
      }
    );
    const storagedAfter = GuessGame.loadDataByAccount(storage, creator.address);
    await player2Game.createOrJoin();
    await player2Game.guess([0, 1, 2, 3]);
    await player1Game.answerAll();
    const storagedBefore = GuessGame.loadDataByAccount(
      storage,
      creator.address
    );
    expect(storagedBefore).to.deep.equal(storagedAfter);
    GuessGame.storeNotPlaying(storage, creator.address);
    expect(GuessGame.isStoredPlaying(storage, creator.address)).to.equal(false);

    player1Game = await GuessGame.create(
      storage,
      [0, 1, 2, 3],
      async (character, salt) => {
        return createGuessGame(
          gameContract,
          boardZKFiles,
          questionZKFiles,
          guessZKFiles,
          character,
          salt
        );
      }
    );
    const storagedBeforeCreation = GuessGame.loadDataByAccount(
      storage,
      creator.address
    );
    expect(storagedBeforeCreation).to.not.deep.equal(storagedAfter);
    expect(GuessGame.isStoredPlaying(storage, creator.address)).to.equal(true);
  });

  it("Should not be able to create new fresh game when fail", async () => {
    const storage = new MockStorage();

    // create a fresh game for player 1
    player1Game = await GuessGame.create(
      storage,
      [0, 1, 2, 3],
      async (character, salt) => {
        return createGuessGame(
          gameContract,
          boardZKFiles,
          questionZKFiles,
          guessZKFiles,
          character,
          salt
        );
      }
    );
    const storagedAfter = GuessGame.loadDataByAccount(storage, creator.address);
    try {
      await GuessGame.create(storage, [0, 1, 2, 3], async (character, salt) => {
        return createGuessGame(
          gameContract,
          boardZKFiles,
          questionZKFiles,
          guessZKFiles,
          character,
          salt
        );
      });
      throw new Error("Should not be able to create a new game");
    } catch (error) {}
    const storagedBefore = GuessGame.loadDataByAccount(
      storage,
      creator.address
    );
    expect(storagedBefore).to.deep.equal(storagedAfter);
    expect(GuessGame.isStoredPlaying(storage, creator.address)).to.equal(true);
  });

  it("should be able to store a game by account", async () => {
    const storage = new MockStorage();
    const gameLoaded = GuessGame.loadDataByAccount(storage, creator.address);
    expect(gameLoaded).to.equal(undefined);

    await GuessGame.create(storage, [0, 1, 2, 3], async (character, salt) => {
      return createGuessGame(
        gameContract,
        boardZKFiles,
        questionZKFiles,
        guessZKFiles,
        character,
        salt
      );
    });

    const result = GuessGame.loadDataByAccount(storage, creator.address);

    expect(result?.character).to.deep.equal([0, 1, 2, 3]);
    // eslint-disable-next-line no-unused-expressions
    expect(result?.salt).to.be.not.undefined;
    // eslint-disable-next-line no-unused-expressions
    expect(player1Game).to.be.not.undefined;
  });

  it("should return undefined to get a game by account if not exist", async () => {
    const storage = new MockStorage();
    const gameLoaded = GuessGame.loadDataByAccount(storage, creator.address);
    expect(gameLoaded).to.equal(undefined);

    // creator
    await GuessGame.create(storage, [0, 1, 2, 3], async (character, salt) => {
      return createGuessGame(
        gameContract,
        boardZKFiles,
        questionZKFiles,
        guessZKFiles,
        character,
        salt
      );
    });

    const result = GuessGame.loadDataByAccount(storage, guesser.address);
    // eslint-disable-next-line no-unused-expressions
    expect(result).to.be.undefined;
  });
});

// eslint-disable-next-line no-undef
class MockStorage implements Storage {
  private store: { [key: string]: string } = {};
  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}
