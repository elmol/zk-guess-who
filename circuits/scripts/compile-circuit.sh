#!/bin/bash
compile() {
    circuit="$1"
    echo "Compiling $circuit.circom..."
    # compile circuit
    ## TODO: FIX this in a secure way
    rm -f $circuit.circom
    cp ../src/$circuit.circom .

    # compile
    circom "$circuit".circom --r1cs --wasm --sym -o .
    snarkjs r1cs info "$circuit".r1cs

    # Start a new zkey and make a contribution
    echo "Start a new zkey and make a contribution"
    snarkjs groth16 setup $circuit.r1cs powersOfTau28_hez_final_10.ptau "$circuit"_0000.zkey
    snarkjs zkey contribute "$circuit"_0000.zkey circuit_final_$circuit.zkey --name="1st Contributor Name" -v -e="random text"
    snarkjs zkey export verificationkey circuit_final_$circuit.zkey "$circuit"_verification_key.json

    # generate solidity contract
    circuit_upper=$(sed -r 's/(^|-)(\w)/\U\2/g' <<< "$circuit") 
    snarkjs zkey export solidityverifier circuit_final_$circuit.zkey Verifier$circuit_upper.sol

    sed -i -e "s/Verifier/Verifier$circuit_upper/g" Verifier$circuit_upper.sol
    sed -i -e "s/pragma solidity ^0.6.11/pragma solidity ^0.8.0/g" Verifier$circuit_upper.sol
} 

### MAIN
mkdir -p artifacts
cd artifacts

if [ -f ./powersOfTau28_hez_final_10.ptau ]; then
    echo "powersOfTau28_hez_final_10.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_10.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
fi

########### CIRCUITS COMPLIATION
compile game
compile board
compile question
compile guess
cd ../