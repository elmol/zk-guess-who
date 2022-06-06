#!/bin/bash
rm -f contracts/VerifierGame.sol
cp circuits/artifacts/VerifierGame.sol contracts/VerifierGame.sol

rm -rf artifacts/circuits
mkdir -p artifacts/circuits
cp circuits/artifacts/game_js/game.wasm artifacts/circuits/game.wasm
cp circuits/artifacts/circuit_final_game.zkey artifacts/circuits/circuit_final_game.zkey