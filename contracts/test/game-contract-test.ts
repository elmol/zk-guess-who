import { expect } from "chai";
import { ethers } from "hardhat";
import { Game, Game__factory } from "../typechain";
import { createGuessGame, GuessGame } from "../game/guess-game";

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

  xit("should allow to create a new game selecting a character", async function () {
    const character = VALID_CHARACTER;
    const salt = 231;
    guessGame = createGuessGame(game, character, salt);
    const hash = await guessGame.start();
    expect(await game.hash()).to.equal(hash);
  });

  xit("should allow to the guesser to ask a question", async function () {
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

  xit("should allow to guess the character", async function () {
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

  xit("should emit event when question is asked", async function () {
    // initialize the game
    await guessGame.start();

    // guesser player fist ask
    await expect(game.ask(0, 3)).to.emit(game, "QuestionAsked").withArgs(0, 3);
  });

  it("should emit event when question is answer", async function () {
    // initialize the game
    await guessGame.start();

    // guesser player fist ask
    // true question
    await guessGame.question(0, 3);

    let eventEmmited = false;
    game.on("QuestionAnswered", (answer) => {
      expect(answer).to.equal(1);
      eventEmmited = true;
    });

    // selector player respond
    const response = await guessGame.answer();
    expect(response).to.equal(1);

    //wait until event 
    await new Promise((resolve) => setTimeout(resolve, 2500));
    expect(eventEmmited).to.equal(true);
  });
});
