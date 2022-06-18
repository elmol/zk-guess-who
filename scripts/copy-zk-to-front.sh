#!/bin/bash
rm -f frontend/public/Game.json
cp contracts/artifacts/contracts/Game.sol/Game.json frontend/public/Game.json

rm -f frontend/game/game-zk.ts
rm -f frontend/game/guess-game.ts
rm -f frontend/game/zk-utils.ts


cp contracts/game/*.ts frontend/game

rm -f frontend/public/board.wasm
cp contracts/artifacts/circuits/board.wasm frontend/public/board.wasm

rm -f frontend/public/circuit_final_board.zkey
cp contracts/artifacts/circuits/circuit_final_board.zkey frontend/public/circuit_final_board.zkey


rm -f frontend/public/question.wasm
cp contracts/artifacts/circuits/question.wasm frontend/public/question.wasm

rm -f frontend/public/circuit_final_question.zkey
cp contracts/artifacts/circuits/circuit_final_question.zkey frontend/public/circuit_final_question.zkey


rm -f frontend/public/guess.wasm
cp contracts/artifacts/circuits/guess.wasm frontend/public/guess.wasm

rm -f frontend/public/circuit_final_guess.zkey
cp contracts/artifacts/circuits/circuit_final_guess.zkey frontend/public/circuit_final_guess.zkey
