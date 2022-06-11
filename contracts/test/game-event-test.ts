import { expect } from "chai";
import { ethers } from "hardhat";
import { Game, Game__factory } from "../typechain";
import { createGuessGame, GuessGame } from "../game/guess-game";

const VALID_CHARACTER = [3, 2, 1, 0];
let guessGame: GuessGame;

describe("Game Event", function () {
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

  it("should emit event when question is answer", async function () {
    // initialize the game
    await guessGame.start();

    // guesser player fist ask
    // true question
    await guessGame.question(0, 3);

    let eventEmmited = false;
    game.on("QuestionAnswered", (answer) => {
      expect(answer).to.equal(2);
      eventEmmited = true;
    });

    // selector player respond
    const response = await guessGame.answer();
    expect(response).to.equal(2);

    // wait until event
    await new Promise((resolve) => setTimeout(resolve, 2500));
    expect(eventEmmited).to.equal(true);
  });

  it("should game allow to handle question asked event", async function () {
    // initialize the game
    await guessGame.start();

    let eventEmmited = false;
    const callback = (type: number, characteristic: number) => {
      expect(type).to.equal(0);
      expect(characteristic).to.equal(3);
      eventEmmited = true;
    };

    guessGame.onQuestionAsked(callback);
    await game.ask(0, 3);

    // wait until event
    await new Promise((resolve) => setTimeout(resolve, 5000));
    expect(eventEmmited).to.equal(true);
  });

  it("should game allow to handle question answered event", async function () {
    // initialize the game
    await guessGame.start();

    await game.ask(0, 3);

    let eventEmmited = false;
    const callback = (answer: number) => {
      expect(answer).to.equal(2);
      eventEmmited = true;
    };

    guessGame.onQuestionAnswered(callback);
    await guessGame.answer();

    // wait until event
    await new Promise((resolve) => setTimeout(resolve, 5000));
    expect(eventEmmited).to.equal(true);
  });
});
