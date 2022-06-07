//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./VerifierGame.sol";

contract Game {

    uint8 public  lastType;
    uint8 public  lastCharacteristic;
    uint8 public  lastResponse;
    uint[4] public lastGuess;
    uint public won;

    uint256 public hash;
    
    VerifierGame private verifier;

    constructor(address _verifier) {
        verifier = VerifierGame(_verifier);
    }


    function start(
        uint256 _hash, //al inputs
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) external {
        uint[10] memory inputs = [
            _hash, //hash
            0,     //guess
            0,     //guess 
            0,     //guess
            0,     //guess
            0,     //ask type
            0,     //ask characteristic 
            0,     //ask response
            0,     //win
            _hash  //hash
        ];
        require(verifier.verifyProof(a, b, c, inputs), "Invalid character selection!");
        hash = _hash;
    }

    function ask(uint8 _type, uint8 _characteristic) external {
        lastType = _type;
        lastCharacteristic = _characteristic;
    }

    function response(uint8 _response, uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c) external {
        uint[10] memory inputs = [
            hash, //hash
            0,     //guess
            0,     //guess 
            0,     //guess
            0,     //guess
            lastType,      //ask type
            lastCharacteristic,     //ask characteristic 
            _response,     //ask response
            0,     //win
            hash  //hash
        ];
        require(verifier.verifyProof(a, b, c, inputs), "Invalid question response!");
        lastResponse = _response;
    }

    function guess(uint8[4] memory _guess) external {
        lastType = 0;
        lastCharacteristic = _guess[lastType];
        lastResponse = 1;
        lastGuess = _guess;
    }

    function isWon(uint8 _won, uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c) external {
        uint[10] memory inputs = [
            hash, //hash
            lastGuess[0],     //guess
            lastGuess[1],     //guess 
            lastGuess[2],     //guess
            lastGuess[3],     //guess
            lastType,      //ask type
            lastCharacteristic,     //ask characteristic 
            lastResponse,     //ask response
            _won,     //win
            hash  //hash
        ];
        require(verifier.verifyProof(a, b, c, inputs), "Invalid guess response!");
        won = _won;
    }


}
