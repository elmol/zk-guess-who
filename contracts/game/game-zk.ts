import { createHash, generateBoardProof, generateGameProof } from "./zk-utils";

// PROOFS GENERATIONS

export async function selectionProof(character: any, salt: any) {
  const input = {
    solutions: character,
    salt: salt,
    solHash: "", // public
  };
  input.solHash = await createHash(input);
  return await generateBoardProof(input);
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
  const question = await generateGameProof(input);
  return question;
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
  return await generateGameProof(input);
}

// VERIFICATIONS
export async function verifyGuess(question: any, verifier: any) {
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
