#!/bin/bash
rm -f contracts/contracts/VerifierBoard.sol
cp circuits/artifacts/VerifierBoard.sol contracts/contracts/VerifierBoard.sol

rm -f contracts/contracts/VerifierQuestion.sol
cp circuits/artifacts/VerifierQuestion.sol contracts/contracts/VerifierQuestion.sol

rm -f contracts/contracts/VerifierGuess.sol
cp circuits/artifacts/VerifierGuess.sol contracts/contracts/VerifierGuess.sol

rm -rf contracts/artifacts/circuits
mkdir -p contracts/artifacts/circuits

cp circuits/artifacts/board_js/board.wasm contracts/artifacts/circuits/board.wasm
cp circuits/artifacts/circuit_final_board.zkey contracts/artifacts/circuits/circuit_final_board.zkey

cp circuits/artifacts/question_js/question.wasm contracts/artifacts/circuits/question.wasm
cp circuits/artifacts/circuit_final_question.zkey contracts/artifacts/circuits/circuit_final_question.zkey

cp circuits/artifacts/guess_js/guess.wasm contracts/artifacts/circuits/guess.wasm
cp circuits/artifacts/circuit_final_guess.zkey contracts/artifacts/circuits/circuit_final_guess.zkey