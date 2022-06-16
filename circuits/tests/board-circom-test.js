// added tests
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
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
const VALID_SOLUTION = [2, 0, 1, 3];

describe("Board Circuits", function () {
  beforeEach(async function () {
    circuit = await wasm_tester("src/board.circom");
    await circuit.loadConstraints();

    poseidon = await buildPoseidon(); // default BN128
    assert(poseidon.F.p == Fr.p, "Poseidon configured with field of same order");
  });

  // The character is defined by a set of 4 characteristics with 4 variants each.
  // 0 < characteristic < 4

  it("should contains characteristics less than 4", async function () {
    const input = {
      solutions: [0, 1, 2, MAX_CHARACTERISTICS],
      salt: 231,
      solHash: HASH,
    };
    await assertionFailInProofGeneration(input);
  });

  //Game Board is composed of 6x4 grid of characters.
  //  [3,1,0,1]	[0,1,2,3]	[2,0,3,0]	[2,0,1,0]	[1,2,3,2]	[1,3,0,3]
  //  [2,1,3,0]	[3,2,1,0]	[2,0,1,3]	[0,1,2,1]	[3,1,0,2]	[3,1,2,1]
  //  [3,1,2,0]	[1,3,2,3]	[2,1,3,1]	[2,0,3,1]	[2,1,0,3]	[3,2,0,2]
  //  [1,3,2,0]	[1,3,0,2]	[2,1,0,1]	[3,2,0,1]	[0,1,3,1]	[3,2,1,2]
  it("Selected Character should be in the Game Board", async function () {
    const input = {
      solutions: [3, 2, 1, 1], // not in the board
      salt: 231,
      solHash: HASH,
    };
    await assertionFailInProofGeneration(input);
  });

  it("Proof should be verified when board setup is valid", async () => {
    let input = {
      solutions: VALID_SOLUTION,
      salt: 231,
    };

    const solnHash = createHash(input);
    input.solHash = solnHash;
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
