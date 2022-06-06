const hre = require('hardhat');
const { ethers, waffle } = hre
const { groth16 } = require("snarkjs");
const { expect, assert } = require("chai");
const buildPoseidon = require("circomlibjs").buildPoseidon;


const VALID_CHARACTER = [3, 2, 1, 0];

describe('Game Contract', function () {
    let verifier;
    let game;
    beforeEach(async function () {
           const Verifier =await ethers.getContractFactory('VerifierGame');
           verifier = await Verifier.deploy();
           await verifier.deployed();

           const Game =await ethers.getContractFactory('Game');
           game = await Game.deploy(verifier.address);
           await game.deployed();


           poseidon = await buildPoseidon();  // default BN128
    });

    it('should be able to generate character selection proof', async function () {
       // player should be able to select a character for this, a random salt will be generated,
       // and the hash after the proof generation will be sent to the other guesser player.


       const character = VALID_CHARACTER;
       const salt = 231;
       const selection = await select(character, salt);
       
       // asserts
       const hash=createHash({solutions:character, salt:salt});
       //output
       expect(selection.input[0]).to.equal(hash); //hash

       //public inputs
       expect(selection.input[1]).to.equal('0'); //guess[0]
       expect(selection.input[2]).to.equal('0'); //guess[1]
       expect(selection.input[3]).to.equal('0'); //guess[2]
       expect(selection.input[4]).to.equal('0'); //guess[3]
       expect(selection.input[5]).to.equal('0'); //ask[0]
       expect(selection.input[6]).to.equal('0'); //ask[1]
       expect(selection.input[7]).to.equal('0'); //ask[2]
       expect(selection.input[8]).to.equal('0'); // win
       expect(selection.input[9]).to.equal(hash); // hash 
              

       expect(await verifier.verifyProof(selection.piA,selection.piB, selection.piC, selection.input)).to.be.true;

    });

    it('should be not able to generate character selection proof is not in the board', async function () {
        const character = [3, 2, 1, 1]; //not in the board
        const salt = 231;
        const proofGenerator = select(character, salt);
        await assertProofGenerationFailed(proofGenerator);
    });

    it('should be able to proof a question correctly', async function () {
        // guesser player will make question about the characteristics of the character
        // selector player will generate a proof that the guesser player with the response (correct or not)
        // guesser player will verify the proof and validate the question

        //create a selection proof
        const character = VALID_CHARACTER;
        const salt = 231;
        const selection = await select(character, salt);   
        
        //create a question proof
        const type=2;
        const characteristic=1
        // is the characteristic type 2 of the character the 1 characteristic

        // selector player generate the proof to respond this question
        const hash=selection.input[0]
        const response=1; 
        
        const question = await questionProof(character, salt, type, characteristic, response, hash); 
        
        //asserts
        //output
        expect(question.input[0]).to.equal(hash); //hash

        //public inputs
        expect(question.input[1]).to.equal('0'); //guess[0]
        expect(question.input[2]).to.equal('0'); //guess[1]
        expect(question.input[3]).to.equal('0'); //guess[2]
        expect(question.input[4]).to.equal('0'); //guess[3]
        expect(question.input[5]).to.equal(type.toString()); //ask[0]
        expect(question.input[6]).to.equal(characteristic.toString()); //ask[1]
        expect(question.input[7]).to.equal(response.toString()); //ask[2]
        expect(question.input[8]).to.equal('0'); // win
        expect(question.input[9]).to.equal(hash); // hash 

        //guesser player verify the proof
        const { isCorrect, questionReponse } = await verifyQuestion(question, verifier);       
        expect(isCorrect).to.be.true;
        expect(questionReponse).to.equal(response.toString());
    });


    it('should be able to proof a guess correctly', async function () {
        // guesser player will guess the character
        // selector player will generate a proof that the guesser player if guess or not
        // guesser player will verify the proof and validate the guess

        //create a selection proof
        const character = VALID_CHARACTER;
        const salt = 231;
        const selection = await select(character, salt);   
        // selector player generate the proof to respond this question
        const hash=selection.input[0]
        
        //create a guess proof
        const guess = [3,2,1,0] //ok 
        const win = 1;
        const proof = await guessProof(character, salt, guess, win, hash);

        
        //asserts
        //output
        expect(proof.input[0]).to.equal(hash); //hash

        //public inputs
        expect(proof.input[1]).to.equal(guess[0].toString()); //guess[0]
        expect(proof.input[2]).to.equal(guess[1].toString()); //guess[1]
        expect(proof.input[3]).to.equal(guess[2].toString()); //guess[2]
        expect(proof.input[4]).to.equal(guess[3].toString()); //guess[3]
        expect(proof.input[5]).to.equal('0'); //ask[0]
        expect(proof.input[6]).to.equal(character[0].toString()); //ask[1]
        expect(proof.input[7]).to.equal('1'); //ask[2]
        expect(proof.input[8]).to.equal(win.toString()); //ask[3] win
        expect(proof.input[9]).to.equal(hash); // hash 

        //guesser player verify the proof
        const { isCorrect, guessResponse } = await guessVerification(proof, verifier);

        expect(isCorrect).to.be.true;
        expect(guessResponse).to.equal(win.toString());
    });

    it('should allow to start the game selecting a character', async function () {
        const character = VALID_CHARACTER;
        const salt = 231;
        const hash = await gameStart(character, salt, game);
        expect(await game.hash()).to.equal(hash);
    });

    it('should allow to the guesser to ask a question', async function () {
        const character = VALID_CHARACTER;
        const salt = 231;

        // initialize the game
        await gameStart(character, salt, game);

        //guesser player fist ask
        const type = 0;
        const characteristic = 1;
        await gameAsk(type, characteristic, game);
        expect(await game.lastType()).to.equal(0);
        expect(await game.lastCharacteristic()).to.equal(1);

        //selector player respond
        const response = await gameRespond(character, salt, game);
        expect(await game.lastResponse()).to.equal(response);
    });


    it('should allow to guess the character', async function () {
        const character = VALID_CHARACTER;
        const salt = 231;

        // initialize the game
        await gameStart(character, salt, game);

        //guess the solution
        const guess=[3,2,1,0] // solution
        await gameGuess(guess, game);

        expect(await game.lastType()).to.equal(0);
        expect(await game.lastCharacteristic()).to.equal(3);
        expect(await game.lastResponse()).to.equal(1);
        expect(await game.lastGuess(0)).to.equal(guess[0]);
        expect(await game.lastGuess(1)).to.equal(guess[1]);
        expect(await game.lastGuess(2)).to.equal(guess[2]);
        expect(await game.lastGuess(3)).to.equal(guess[3]);

        //selector player respond
        const won = await gameWon(character, salt, game);
        expect(await game.won()).to.equal(won);
    });
});

/// HELPERS
async function gameStart(character, salt, game) {
    const selection = await select(character, salt);
    const hash = selection.input[0];
    tx = await game.start(hash, selection.piA, selection.piB, selection.piC);
    await tx.wait();
    return hash;
}

async function gameAsk(type, characteristic,game) {
    tx = await game.ask(type, characteristic);
    await tx.wait();
}

async function gameGuess(guess,game) {
    tx = await game.guess(guess);
    await tx.wait();
}

async function gameRespond(character, salt,game) {
    const type = await game.lastType();
    const characteristic = await game.lastCharacteristic();
    const response = character[type] === characteristic ? 1 : 0;

    //generate question proof
    const hash = await game.hash();
    const question = await questionProof(character, salt, type, characteristic, response, hash.toString());

    tx = await game.response(response, question.piA, question.piB, question.piC);
    await tx.wait();
    return response;
}

async function gameWon(character, salt,game) {
    const hash = await game.hash();
    const guess = [(await game.lastGuess(0)).toNumber(),(await game.lastGuess(1)).toNumber(),(await game.lastGuess(2)).toNumber(),(await game.lastGuess(3)).toNumber()];
    const won = JSON.stringify(character)==JSON.stringify(guess) ? 1 : 0;

    //generate question proof
    const proof = await guessProof(character, salt, guess, won, hash.toString());
    tx = await game.isWon(won, proof.piA, proof.piB, proof.piC);
    await tx.wait();
    return won;
}

async function guessProof(character, salt, guess, win, hash) {
    const input = {
        solutions: character,
        salt: salt,
        ask: [0, character[0], 1],

        guess: guess,
        win: win,
        solHash: hash //public hash
    };
    return await generateProof(input);
}

async function assertProofGenerationFailed(proofGenerator) {
    try {
        await proofGenerator;
        fail();
    } catch (error) {
        expect(error.toString().includes("Assert Failed")).to.be.true;
    }
}

async function guessVerification(question, verifier) {
    const guessResponse = question.input[8]; // response
    const isCorrect = await verifier.verifyProof(question.piA, question.piB, question.piC, question.input);
    return { isCorrect, guessResponse };
}

async function verifyQuestion(question, verifier) {
    const questionReponse = question.input[7]; // response
    const isCorrect = await verifier.verifyProof(question.piA, question.piB, question.piC, question.input);
    return { isCorrect, questionReponse };
}

async function questionProof(character, salt, type, characteristic, response, hash) {
    const input = {
        solutions: character,
        salt: salt,
        ask: [type, characteristic, response],

        guess: [0, 0, 0, 0],
        win: 0,
        solHash: hash //public hash
    };
    const question = await generateProof(input);
    return question;
}

async function select(character, salt) {
    const input = {
        solutions: character,
        salt: salt,

        //not needed for the character selection
        guess: [0, 0, 0, 0],
        ask: [0, 0, 0],
        win: 0, //public 
    };
    input.solHash = createHash(input);
    const selection = await generateProof(input);
    return selection;
}

async function generateProof(input) {
    const { proof, publicSignals } = await groth16.fullProve(input, "artifacts/circuits/game.wasm", "artifacts/circuits/circuit_final_game.zkey");
    const { a, b, c, Input } = await generateCallData(publicSignals, proof);
    const selection = { piA: a, piB: b, piC: c, input: Input };
    return selection;
}

function createHash(input) {
    const poseidonHash = poseidon.F.e(poseidon([input.salt, input.solutions[0], input.solutions[1], input.solutions[2], input.solutions[3]]));
    const solnHash = poseidon.F.toString(poseidonHash, 10);
    return solnHash;
}

async function generateCallData(publicSignals, proof) {
    const editedPublicSignals = unstringifyBigInts(publicSignals);
    const editedProof = unstringifyBigInts(proof);
    const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    // console.log("calldata:",calldata);
    // parse calldata to get the arguments
    const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    // console.log("args",argv);
    // get pairing for build the proof
    const a = [argv[0], argv[1]];
    const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
    const c = [argv[6], argv[7]];
    // console.log("proof", a,b,c);
    // get signal output (2)
    const Input = argv.slice(8);
    return { a, b, c, Input };
}


function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

async function assertionFailInProofGeneration(input) {
    try {
        await groth16.fullProve(input, "artifacts/circuits/game.wasm", "artifacts/circuits/circuit_final_game.zkey");
        fail();
    } catch (error) {
        expect(error.toString().includes("Assert Failed")).to.be.true;
    }
}
