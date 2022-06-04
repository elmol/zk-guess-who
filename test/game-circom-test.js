const hre = require('hardhat');

// added tests
const chai = require("chai");
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect;

const wasm_tester = require("circom_tester").wasm;
const buildPoseidon = require("circomlibjs").buildPoseidon;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);


const HASH = "18311343803305413584032950907343924921402256932959498859603879453231417631685";
const MAX_CHARACTERISTICS = 4;
const VALID_SOLUTION = [2,0,1,3];

describe('Game Circuits', function () {

    beforeEach(async function () {
           circuit = await wasm_tester("artifacts/circuits/game.circom");
           await circuit.loadConstraints();
   
           poseidon = await buildPoseidon();  // default BN128
           assert(poseidon.F.p == Fr.p, "Poseidon configured with field of same order");
     });

     // The character is defined by a set of 4 characteristics with 4 variants each.
     // 0 < characteristic < 4
     describe('Characteristics', function () {

        it('in guess should be less than 4', async function () {
            const input = {
                "guess": [0, MAX_CHARACTERISTICS, 2, 3],
                "solutions": [0, 1, 2, 3],
                "ask": [1,2,1],
                "win": 0,
                "salt":231,
                "solHash": HASH
            }
            await assertionFailInProofGeneration(input);
         });
     
             
        it("in solutions should be less than 4", async function () {
          const input = {
            guess: [0, 1, 2, 3],
            solutions: [0, 1, 2, MAX_CHARACTERISTICS],
            ask: [1, 2, 1],
            win: 0,
            salt: 231,
            solHash: HASH,
          };
          await assertionFailInProofGeneration(input);
        });

        it('asked should be valid (0-3)', async function () {
            const input = {
                "guess": [1, 1, 2, 3],
                "solutions": [0, 1, 2, 3],
                "ask": [3,MAX_CHARACTERISTICS,1],
                "win": 0,
                "salt":231,
                "solHash": HASH
            }
            await assertionFailInProofGeneration(input);
         });
    

    });
     
    it('Character should have 4 characteristic types (0-3)', async function () {
        const input = {
            "guess": [1, 1, 2, 3],
            "solutions": [0, 1, 2, 3],
            "ask": [5,2,1],
            "win": 0,
            "salt":231,
            "solHash": HASH
        }
        await assertionFailInProofGeneration(input);
     });

     //Game Board is composed of 6x4 grid of characters.
    //  [3,1,0,1]	[0,1,2,3]	[2,0,3,0]	[2,0,1,0]	[1,2,3,2]	[1,3,0,3]
    //  [2,1,3,0]	[3,2,1,0]	[2,0,1,3]	[0,1,2,1]	[3,1,0,2]	[3,1,2,1]
    //  [3,1,2,0]	[1,3,2,3]	[2,1,3,1]	[2,0,3,1]	[2,1,0,3]	[3,2,0,2]
    //  [1,3,2,0]	[1,3,0,2]	[2,1,0,1]	[3,2,0,1]	[0,1,3,1]	[3,2,1,2]
     it('Selected Character should be in the Game Board', async function () {
        const input = {
            "guess": [0, 1, 2, 3],
            "solutions": [3, 2, 1, 1], // not in the board
            "ask": [1,2,1],
            "win": 0,
            "salt":231,
            "solHash": HASH
        }
        await assertionFailInProofGeneration(input);
     });
 

     it('Question response should be true or false (0/1)', async function () {
        const input = {
            "guess": [1, 1, 2, 3],
            "solutions": [0, 1, 2, 3],
            "ask": [3,2,2],
            "win": 0,
            "salt":231,
            "solHash": HASH
        }
        await assertionFailInProofGeneration(input);
     });

     it('Question response should be false when the question is false', async function () {
        const input = {
            "guess": [1, 1, 2, 3],
            "solutions": [0, 1, 2, 3],
            "ask": [0,1,1],
            "win": 0,
            "salt":231,
            "solHash": HASH
        }
        await assertionFailInProofGeneration(input);
    });

    it('Question response should be true when the question is true', async function () {
        const input = {
            "guess": [1, 1, 2, 3],
            "solutions": [0, 1, 2, 3],
            "ask": [0,0,0],
            "win": 0,
            "salt":231,
            "solHash": HASH
        }
        await assertionFailInProofGeneration(input);
    });


     it("Proof should be verify when lose", async () => {
    
        let input = {
             "guess": [0, 1, 2, 3],
             "solutions": VALID_SOLUTION,
             "ask": [1,0,1],
             "win": 0,
             "salt":231,
        }
            
        const solnHash = createHash(input);
        input.solHash = solnHash;
        await assertVerifyProof(input, input.solHash);
    });



     it('Proof should be verify when win', async function () {
        const hash = '1777277235915767316413086087329044818051298499936897961862053055117000839929';
        const input = {
            "guess": [2,0,1,3],
            "solutions": VALID_SOLUTION,
            "ask": [1,1,0],
            "win": 1,
            "salt":231,
            "solHash": hash
        }
        input.solHash = createHash(input);
        await assertVerifyProof(input, input.solHash);

     });

});

// test helpers
async function assertVerifyProof(input, solnHash) {
    const witness = await circuit.calculateWitness(input, true);
    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)), "proof is valid");
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(solnHash)), "output equals soln hash");
}

function createHash(input) {
    const poseidonHash = poseidon.F.e(poseidon([input.salt, input.solutions[0], input.solutions[1], input.solutions[2], input.solutions[3]]));
    const solnHash = poseidon.F.toString(poseidonHash, 10);
    return solnHash;
}

async function assertionFailInProofGeneration(input) {
    input.solHash = createHash(input);      
    await expect(circuit.calculateWitness(input, true)).to.be.rejected;
}