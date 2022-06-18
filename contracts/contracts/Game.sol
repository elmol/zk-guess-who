//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./IVerifierBoard.sol";
import "./IVerifierQuestion.sol";
import "./IVerifierGuess.sol";

contract Game {
    event QuestionAsked(uint8 _type, uint8 _characteristic);
    event QuestionAnswered(uint8 _answer);

    event Guess(uint256[4] _guess);
    event GuessResponse(uint8 _answer);

    uint8 public lastType;
    uint8 public lastCharacteristic;
    uint8 public lastResponse; //last response 0:not answered, 1:wrong, 2:correct
    uint256[4] public lastGuess; //last guess 0:not answered, 1:wrong, 2:correct
    uint8 public won;

    uint256 public hash;

    IVerifierBoard private verifierBoard;
    IVerifierQuestion private verifierQuestion;
    IVerifierGuess private verifierGuess;

    constructor(
        address _verifierBoard,
        address _verifierQuestion,
        address _verifierGuess
    ) {
        verifierBoard = IVerifierBoard(_verifierBoard);
        verifierQuestion = IVerifierQuestion(_verifierQuestion);
        verifierGuess = IVerifierGuess(_verifierGuess);
    }

    modifier gameCreated() {
        require(hash!=0,"Game not started");
        _;
    }

    function start(
        uint256 _hash, //al inputs
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) external {
        require(hash == 0, "Game already created");
        uint256[1] memory inputs = [_hash];
        require(
            verifierBoard.verifyProof(a, b, c, inputs),
            "Invalid character selection!"
        );
        hash = _hash;
    }

    function ask(uint8 _type, uint8 _characteristic) external gameCreated {
        lastType = _type;
        lastCharacteristic = _characteristic;
        lastResponse = 0; // set last response to 0, not answered
        emit QuestionAsked(_type, _characteristic);
    }

    function response(
        uint8 _answer,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) external gameCreated {
        uint256[4] memory inputs = [
            _answer, //hash
            lastType, //ask type
            lastCharacteristic, //ask characteristic
            hash //hash
        ];
        require(
            verifierQuestion.verifyProof(a, b, c, inputs),
            "Invalid question answer!"
        );
        lastResponse = _answer + 1; //1: false, 2: true
        emit QuestionAnswered(lastResponse);
    }

    function guess(uint8[4] memory _guess) external gameCreated {
        lastGuess = _guess;
        won = 0;
        emit Guess(lastGuess);
    }

    function isWon (
        uint8 _won,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) external gameCreated {
        uint256[6] memory inputs = [
            _won, //hash
            lastGuess[0], //guess
            lastGuess[1], //guess
            lastGuess[2], //guess
            lastGuess[3], //guess
            hash //hash
        ];
        require(
            verifierGuess.verifyProof(a, b, c, inputs),
            "Invalid guess response!"
        );
        won = _won + 1; //0: pending //1: false, 2: true
        emit GuessResponse(won);
    }

    function isStarted() external view returns (bool) {
        return hash != 0;
    }
}
