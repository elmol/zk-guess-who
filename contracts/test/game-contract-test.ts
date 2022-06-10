import { expect } from "chai";
import { ethers } from "hardhat";
import { Game, Game__factory } from "../typechain";
import { GuessGame } from "./guess-game";

const VALID_CHARACTER = [3, 2, 1, 0];
let guessGame: GuessGame;

describe("Game Contract", function () {
  let game: Game;
  let verifier: any;

  beforeEach(async function () {
    const Verifier = await ethers.getContractFactory("VerifierGame");
    verifier = await Verifier.deploy();
    await verifier.deployed();

    const gameFactory = (await ethers.getContractFactory(
      "Game"
      // eslint-disable-next-line camelcase
    )) as Game__factory;
    game = await gameFactory.deploy(verifier.address);
    await game.deployed();
    guessGame = new GuessGame(game);
  });

  it("should allow to start the game selecting a character", async function () {
    const character = VALID_CHARACTER;
    const salt = 231;
    const hash = await gameStart(character, salt, game);
    expect(await game.hash()).to.equal(hash);
  });

  it("should allow to the guesser to ask a question", async function () {
    const character = VALID_CHARACTER;
    const salt = 231;

    // initialize the game
    await gameStart(character, salt, game);

    // guesser player fist ask
    const type = 0;
    const characteristic = 1;
    await gameAsk(type, characteristic, game);
    expect(await game.lastType()).to.equal(0);
    expect(await game.lastCharacteristic()).to.equal(1);

    // selector player respond
    const response = await gameRespond(character, salt, game);
    expect(await game.lastResponse()).to.equal(response);
  });

  it("should allow to guess the character", async function () {
    const character = VALID_CHARACTER;
    const salt = 231;

    // initialize the game
    await gameStart(character, salt, game);

    // guess the solution
    const guess = [3, 2, 1, 0]; // solution
    await gameGuess(guess, game);

    expect(await game.lastType()).to.equal(0);
    expect(await game.lastCharacteristic()).to.equal(3);
    expect(await game.lastResponse()).to.equal(1);
    expect(await game.lastGuess(0)).to.equal(guess[0]);
    expect(await game.lastGuess(1)).to.equal(guess[1]);
    expect(await game.lastGuess(2)).to.equal(guess[2]);
    expect(await game.lastGuess(3)).to.equal(guess[3]);

    // selector player respond
    const won = await gameWon(character, salt, game);
    expect(await game.won()).to.equal(won);
  });
});

async function gameStart(character: any, salt: any, game: any) {
  return guessGame.start(character, salt);
}

async function gameAsk(type: any, characteristic: any, game: any) {
  return guessGame.question(type, characteristic);
}

async function gameGuess(guess: any, game: any) {
  return guessGame.guess(guess);
}

async function gameRespond(character: any, salt: any, game: any) {
  return guessGame.answer(character, salt);
}

export async function gameWon(character: any, salt: any, game: any) {
  return guessGame.guessAnswer(character, salt);
}
