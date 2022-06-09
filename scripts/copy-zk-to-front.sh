#!/bin/bash
rm -f frontend/public/Game.json
cp contracts/artifacts/contracts/Game.sol/Game.json frontend/public/Game.json

rm -f frontend/public/circuit_final_game.zkey
cp contracts/artifacts/circuits/game.wasm frontend/public/circuit_final_game.zkey

rm -f frontend/public/circuit_final_game.zkey
cp contracts/artifacts/circuits/circuit_final_game.zkey frontend/public/circuit_final_game.zkey