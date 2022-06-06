const fs = require("fs");
const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/
const solidityRegex2 = /contract Verifier/


let content = fs.readFileSync("./artifacts/VerifierGame.sol", { encoding: 'utf-8' });
let bumped = content.replace(solidityRegex, 'pragma solidity ^0.8.0');
let bumped2 = bumped.replace(solidityRegex2, 'contract VerifierGame'); 

fs.writeFileSync("./artifacts/VerifierGame.sol", bumped2);