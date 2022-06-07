const { groth16 } = require("snarkjs");

const buildPoseidon = require("circomlibjs").buildPoseidon;

export async function gameStart(character: any, salt: any, game: any) {
  const selection = await select(character, salt);
  const hash = selection.input[0];
  const tx = await game.start(
    hash,
    selection.piA,
    selection.piB,
    selection.piC
  );
  await tx.wait();
  return hash;
}

export async function gameAsk(type: any, characteristic: any, game: any) {
  const tx = await game.ask(type, characteristic);
  await tx.wait();
}

export async function gameGuess(guess: any, game: any) {
  const tx = await game.guess(guess);
  await tx.wait();
}

export async function gameRespond(character: any, salt: any, game: any) {
  const type = await game.lastType();
  const characteristic = await game.lastCharacteristic();
  const response = character[type] === characteristic ? 1 : 0;

  // generate question proof
  const hash = await game.hash();
  const question = await questionProof(
    character,
    salt,
    type,
    characteristic,
    response,
    hash.toString()
  );

  const tx = await game.response(
    response,
    question.piA,
    question.piB,
    question.piC
  );
  await tx.wait();
  return response;
}

export async function gameWon(character: any, salt: any, game: any) {
  const hash = await game.hash();
  const guess = [
    (await game.lastGuess(0)).toNumber(),
    (await game.lastGuess(1)).toNumber(),
    (await game.lastGuess(2)).toNumber(),
    (await game.lastGuess(3)).toNumber(),
  ];
  const won = JSON.stringify(character) === JSON.stringify(guess) ? 1 : 0;

  // generate question proof
  const proof = await guessProof(character, salt, guess, won, hash.toString());
  const tx = await game.isWon(won, proof.piA, proof.piB, proof.piC);
  await tx.wait();
  return won;
}

export async function guessProof(
  character: any,
  salt: any,
  guess: any,
  win: any,
  hash: any
) {
  const input = {
    solutions: character,
    salt: salt,
    ask: [0, character[0], 1],

    guess: guess,
    win: win,
    solHash: hash, // public hash
  };
  return await generateProof(input);
}

export async function select(character: any, salt: any) {
  const input = {
    solutions: character,
    salt: salt,

    // not needed for the character selection
    guess: [0, 0, 0, 0],
    ask: [0, 0, 0],
    win: 0, // public
    solHash: "", // public
  };
  input.solHash = await createHash(input);
  const selection = await generateProof(input);
  return selection;
}

export async function generateProof(input: any) {
  const { proof, publicSignals } = await groth16.fullProve(
    input,
    "artifacts/circuits/game.wasm",
    "artifacts/circuits/circuit_final_game.zkey"
  );
  const { a, b, c, Input } = await generateCallData(publicSignals, proof);
  const selection = { piA: a, piB: b, piC: c, input: Input };
  return selection;
}

export async function generateCallData(publicSignals: any, proof: any) {
  const editedPublicSignals = unstringifyBigInts(publicSignals);
  const editedProof = unstringifyBigInts(proof);
  const calldata = await groth16.exportSolidityCallData(
    editedProof,
    editedPublicSignals
  );
  // console.log("calldata:",calldata);
  // parse calldata to get the arguments
  const argv = calldata
    .replace(/["[\]\s]/g, "")
    .split(",")
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    .map((x: any) => BigInt(x).toString());
  // console.log("args",argv);
  // get pairing for build the proof
  const a = [argv[0], argv[1]];
  const b = [
    [argv[2], argv[3]],
    [argv[4], argv[5]],
  ];
  const c = [argv[6], argv[7]];
  // console.log("proof", a,b,c);
  // get signal output (2)
  const Input = argv.slice(8);
  return { a, b, c, Input };
}

export function unstringifyBigInts(o: any): any {
  if (typeof o === "string" && /^[0-9]+$/.test(o)) {
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    return BigInt(o);
  } else if (typeof o === "string" && /^0x[0-9a-fA-F]+$/.test(o)) {
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    return BigInt(o);
  } else if (Array.isArray(o)) {
    return o.map(unstringifyBigInts);
  } else if (typeof o === "object") {
    if (o === null) return null;
    const res: any = {};
    const keys = Object.keys(o);
    keys.forEach((k) => {
      res[k] = unstringifyBigInts(o[k]);
    });
    return res;
  } else {
    return o;
  }
}

export async function questionProof(
  character: number[],
  salt: number,
  type: number,
  characteristic: number,
  response: number,
  hash: any
) {
  const input = {
    solutions: character,
    salt: salt,
    ask: [type, characteristic, response],

    guess: [0, 0, 0, 0],
    win: 0,
    solHash: hash, // public hash
  };
  const question = await generateProof(input);
  return question;
}

export async function guessVerification(question: any, verifier: any) {
  const guessResponse = question.input[8]; // response
  const isCorrect = await verifier.verifyProof(
    question.piA,
    question.piB,
    question.piC,
    question.input
  );
  return { isCorrect, guessResponse };
}

export async function verifyQuestion(question: any, verifier: any) {
  const questionReponse = question.input[7]; // response
  const isCorrect = (await verifier.verifyProof(
    question.piA,
    question.piB,
    question.piC,
    question.input
  )) as boolean;
  return { isCorrect, questionReponse };
}

export async function createHash(input: any) {
  const poseidon = await buildPoseidon(); // default BN128
  const poseidonHash = poseidon.F.e(
    poseidon([
      input.salt,
      input.solutions[0],
      input.solutions[1],
      input.solutions[2],
      input.solutions[3],
    ])
  );
  const solnHash = poseidon.F.toString(poseidonHash, 10);
  return solnHash;
}
