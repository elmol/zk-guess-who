#!/bin/bash

mkdir -p artifacts
cd artifacts

if [ -f ./powersOfTau28_hez_final_10.ptau ]; then
    echo "powersOfTau28_hez_final_10.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_10.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
fi

echo "Compiling game.circom..."

# compile circuit
## TODO: FIX this in a secure way
rm -f game.circom
cp ../src/game.circom .

circom game.circom --r1cs --wasm --sym -o .
snarkjs r1cs info game.r1cs

# Start a new zkey and make a contribution

snarkjs groth16 setup game.r1cs powersOfTau28_hez_final_10.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final_game.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey circuit_final_game.zkey verification_key.json

# generate solidity contract
snarkjs zkey export solidityverifier circuit_final_game.zkey VerifierGame.sol

sed -i -e "s/Verifier/VerifierGame/g" VerifierGame.sol
sed -i -e "s/pragma solidity ^0.6.11/pragma solidity ^0.8.0/g" VerifierGame.sol

cd ../