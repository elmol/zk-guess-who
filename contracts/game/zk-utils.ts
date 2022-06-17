const { groth16 } = require("snarkjs");
const buildPoseidon = require("circomlibjs").buildPoseidon;

export class ZKUtils {
  // eslint-disable-next-line no-useless-constructor
  constructor(private wasmFile: string, private zkeyFile: string) {}

  public async generateProof(input: any) {
    return await this.generateProofFrom(input, this.wasmFile, this.zkeyFile);
  }

  private async generateProofFrom(
    input: any,
    wasmFile: string,
    zkeyFile: string
  ) {
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      wasmFile,
      zkeyFile
    );
    const { a, b, c, Input } = await this.generateCallData(
      publicSignals,
      proof
    );
    const selection = { piA: a, piB: b, piC: c, input: Input };
    return selection;
  }

  private async generateCallData(publicSignals: any, proof: any) {
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
}

// UTILS
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
  return poseidon.F.toString(poseidonHash, 10);
}

function unstringifyBigInts(o: any): any {
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
