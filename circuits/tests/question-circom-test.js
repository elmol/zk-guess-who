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

const MAX_CHARACTERISTICS = 4;
const VALID_SOLUTION = [2, 0, 1, 3];

describe("Question Circuits", function () {
  beforeEach(async function () {
    circuit = await wasm_tester("src/question.circom");
    await circuit.loadConstraints();

    poseidon = await buildPoseidon(); // default BN128
    assert(poseidon.F.p == Fr.p, "Poseidon configured with field of same order");
  });

  it("should verify question hash", async function () {
    const input = {
      solutions: VALID_SOLUTION,
      ask: [1, 1],
      salt: 231,
    };
    input.solHash = createHash(input);
    await assertVerifyProof(input, 0);
  });

  it("should not verify question wrong hash", async function () {
    const input = {
      solutions: VALID_SOLUTION,
      ask: [1, 1],
      salt: 231,
    };
    //WRONG HASH
    input.solHash = "1777277235915767316413086087329044818051298499936897961862053055117000839923";
    await expect(circuit.calculateWitness(input, true)).to.be.rejected;
  });

  // The character is defined by a set of 4 characteristics with 4 variants each.
  // 0 < characteristic < 4

  it("should asked characteristics be valid (0-3)", async function () {
    const input = {
      solutions: [0, 1, 2, 3],
      ask: [3, MAX_CHARACTERISTICS],
      salt: 231,
    };
    input.solHash = createHash(input);
    await assertionFailInProofGeneration(input);
  });

  it("Character should have 4 characteristic types (0-3)", async function () {
    const input = {
      solutions: [0, 1, 2, 3],
      ask: [5, 2],
      salt: 231,
    };
    input.solHash = createHash(input);
    await assertionFailInProofGeneration(input);
  });

  it("Question response should be false when the question is false", async function () {
    const input = {
      solutions: [0, 1, 2, 3],
      ask: [0, 1],
      salt: 231,
    };
    input.solHash = createHash(input);
    const witness = await circuit.calculateWitness(input, true);
    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)), "proof is valid");
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(0)), "false");
  });

  it("Question response should be true when the question is true", async function () {
    const input = {
      solutions: [0, 1, 2, 3],
      ask: [0, 0],
      salt: 231,
    };
    input.solHash = createHash(input);
    const witness = await circuit.calculateWitness(input, true);
    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)), "proof is valid");
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(1)), "true");
   
  });
});

// test helpers
async function assertVerifyProof(input, answer) {
  const witness = await circuit.calculateWitness(input, true);
  assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)), "proof is valid");
  assert(Fr.eq(Fr.e(witness[1]), Fr.e(answer)), "answer");
}

function createHash(input) {
  const poseidonHash = poseidon.F.e(poseidon([input.salt, input.solutions[0], input.solutions[1], input.solutions[2], input.solutions[3]]));
  return poseidon.F.toString(poseidonHash, 10);
}

async function assertionFailInProofGeneration(input) {
  input.solHash = createHash(input);
  await expect(circuit.calculateWitness(input, true)).to.be.rejected;
}
