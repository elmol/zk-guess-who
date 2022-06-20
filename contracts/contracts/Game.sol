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
    uint8 public lastResponse; //last response 0:not answered, 1:wrong, 2:correct 3:never response
    uint256[4] public lastGuess;
    uint8 public won; //last guess 0:not answered, 1:wrong, 2:correct 3:never guess

    uint256 public hash;
    address public creator;
    address[2] public players;

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
        require(hash != 0, "Game not started");
        _;
    }

    modifier gameStarted() {
        require(hash != 0, "Game not started");
        require(players[1] != address(0), "Player 2 is not join");
        _;
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator can call this function");
        _;
    }

    function start(
        uint256 _hash, //al inputs
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) external {
        require(players[0] == address(0),"Game already created");
        require(hash == 0, "Game already created");
        uint256[1] memory inputs = [_hash];
        require(
            verifierBoard.verifyProof(a, b, c, inputs),
            "Invalid character selection!"
        );
        hash = _hash;
        creator = msg.sender;
        players[0] = msg.sender;
        lastResponse = 3;
        won = 3;
    }


    function join(
        uint256 _hash, //al inputs
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) external gameCreated {
        require(players[1] == address(0),"Game Room already full");
        uint256[1] memory inputs = [_hash];
        require(
            verifierBoard.verifyProof(a, b, c, inputs),
            "Invalid character selection!"
        );
        // hash = _hash;
        // creator = msg.sender;
        players[1] = msg.sender;
        lastResponse = 3;
        won = 3;
    }



    function ask(uint8 _type, uint8 _characteristic) external gameStarted {
        require(lastResponse != 0, "Question is pending of answer");
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
    ) external gameStarted onlyCreator {
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

    function guess(uint8[4] memory _guess) external gameStarted {
        require(won != 0, "Guess is pending of answer");
        lastGuess = _guess;
        won = 0;
        emit Guess(lastGuess);
    }

    function isWon(
        uint8 _won,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) external gameStarted onlyCreator {
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
        end();
        emit GuessResponse(won);
    }

    function isStarted() external view returns (bool) {
        return hash != 0 && players[1] != address(0);
    }

    function isCreated() external view returns (bool) {
        return players[0] != address(0) && players[1] == address(0);
    }

    function isGameCreator() external view returns (bool) {
        return msg.sender == creator;
    }

    // PRIVATE FUNCTIONS

    function end() private gameStarted {
   //     require(hash != 0, "Game not started");
        hash = 0;
        creator = address(0);

        // free room
        players[0] = address(0);
        players[1] = address(0);
    }
}
