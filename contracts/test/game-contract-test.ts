import { expect } from "chai";
import { ethers } from "hardhat";
import { Game, Game__factory } from "../typechain";
import { createGuessGame, GuessGame } from "./guess-game";

const VALID_CHARACTER = [3, 2, 1, 0];
let guessGame: GuessGame;

describe("Game Contract", function () {
  let game: Game;

  beforeEach(async function () {
    const Verifier = await ethers.getContractFactory("VerifierGame");
    const verifier = await Verifier.deploy();
    await verifier.deployed();

    const gameFactory = (await ethers.getContractFactory(
      "Game"
      // eslint-disable-next-line camelcase
    )) as Game__factory;
    game = await gameFactory.deploy(verifier.address);
    await game.deployed();
    const character = VALID_CHARACTER;
    const salt = 231;
    guessGame = createGuessGame(game, character, salt);
  });

  it("should allow to create a new game selecting a character", async function () {
    const character = VALID_CHARACTER;
    const salt = 231;
    guessGame = createGuessGame(game, character, salt);
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

    expect(await game.lastType()).to.equal(0);
    expect(await game.lastCharacteristic()).to.equal(3);
    expect(await game.lastResponse()).to.equal(1);
    expect(await game.lastGuess(0)).to.equal(guess[0]);
    expect(await game.lastGuess(1)).to.equal(guess[1]);
    expect(await game.lastGuess(2)).to.equal(guess[2]);
    expect(await game.lastGuess(3)).to.equal(guess[3]);

    // selector player respond
    const won = await guessGame.guessAnswer();
    expect(await game.won()).to.equal(won);
  });
});
