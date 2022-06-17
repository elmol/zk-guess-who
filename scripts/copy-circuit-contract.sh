#!/bin/bash
rm -f contracts/contracts/VerifierGame.sol
cp circuits/artifacts/VerifierGame.sol contracts/contracts/VerifierGame.sol

rm -f contracts/contracts/VerifierBoard.sol
cp circuits/artifacts/VerifierBoard.sol contracts/contracts/VerifierBoard.sol

rm -rf contracts/artifacts/circuits
mkdir -p contracts/artifacts/circuits
cp circuits/artifacts/game_js/game.wasm contracts/artifacts/circuits/game.wasm
cp circuits/artifacts/circuit_final_game.zkey contracts/artifacts/circuits/circuit_final_game.zkey

cp circuits/artifacts/board_js/board.wasm contracts/artifacts/circuits/board.wasm
cp circuits/artifacts/circuit_final_board.zkey contracts/artifacts/circuits/circuit_final_board.zkey