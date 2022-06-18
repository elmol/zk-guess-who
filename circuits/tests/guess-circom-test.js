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

describe("Guess Circuits", function () {
  beforeEach(async function () {
    circuit = await wasm_tester("src/guess.circom");
    await circuit.loadConstraints();

    poseidon = await buildPoseidon(); // default BN128
    assert(poseidon.F.p == Fr.p, "Poseidon configured with field of same order");
  });

  it("should not verify guess wrong hash", async function () {
    const hash = "1777277235915767316413086087329044818051298499936897961862053055117000839929";
    const input = {
      guess: [2, 0, 1, 3],
      solutions: VALID_SOLUTION,
      salt: 231,
      solHash: hash,
    };
    await expect(circuit.calculateWitness(input, true)).to.be.rejected;
  });

  // The character is defined by a set of 4 characteristics with 4 variants each.
  // 0 < characteristic < 4
  it("should characteristics in guess should be less than 4", async function () {
    const input = {
      guess: [0, MAX_CHARACTERISTICS, 2, 3],
      solutions: [0, 1, 2, 3],
      salt: 231,
      solHash: HASH,
    };
    await assertionFailInProofGeneration(input);
  });

  it("Proof should be verify when lose", async () => {
    let input = {
      guess: [0, 1, 2, 3],
      solutions: VALID_SOLUTION,
      salt: 231,
    };
    
    const solnHash = createHash(input);
    input.solHash = solnHash;
    // win: 0,
    await assertVerifyProofGuess(input, 0);
  });

  it("Proof should be verify when win", async function () {
    const input = {
      guess: [2, 0, 1, 3],
      solutions: VALID_SOLUTION,
      salt: 231,
    };

    const solnHash = createHash(input);
    input.solHash = solnHash;
    // win = 1
    await assertVerifyProofGuess(input, 1);
  });
});

// test helpers
async function assertVerifyProofGuess(input, win) {
  const witness = await circuit.calculateWitness(input, true);
  assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)), "proof is valid");
  assert(Fr.eq(Fr.e(witness[1]), Fr.e(win)), "win");
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
