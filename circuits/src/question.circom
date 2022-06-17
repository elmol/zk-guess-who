pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/comparators.circom"; // relative path form artifact/circuits
include "../node_modules/circomlib/circuits/poseidon.circom";  // relative path form artifact/circuits

// Selection FROM
// https://github.com/privacy-scaling-explorations/maci/blob/v1/circuits/circom/trees/incrementalQuinTree.circom#L29


// This circuit returns the sum of the inputs.
// n must be greater than 0.
template CalculateTotal(n) {
    signal input nums[n];
    signal output sum;

    signal sums[n];
    sums[0] <== nums[0];

    for (var i=1; i < n; i++) {
        sums[i] <== sums[i - 1] + nums[i];
    }

    sum <== sums[n - 1];
}

/*
 * Given a list of items and an index, output the item at the position denoted
 * by the index. The number of items must be less than 8, and the index must
 * be less than the number of items.
 */
template QuinSelector(choices) {
    signal input in[choices];
    signal input index;
    signal output out;
    
    // Ensure that index < choices
    component lessThan = LessThan(3);
    lessThan.in[0] <== index;
    lessThan.in[1] <== choices;
    lessThan.out === 1;

    component calcTotal = CalculateTotal(choices);
    component eqs[choices];

    // For each item, check whether its index equals the input index.
    for (var i = 0; i < choices; i ++) {
        eqs[i] = IsEqual();
        eqs[i].in[0] <== i;
        eqs[i].in[1] <== index;

        // eqs[i].out is 1 if the index matches. As such, at most one input to
        // calcTotal is not 0.
        calcTotal.nums[i] <== eqs[i].out * in[i];
    }

    // Returns 0 + 0 + ... + item
    out <== calcTotal.sum;
}

template Question() {
    // Public inputs guess
    signal input ask[3]; //position, characteristic, response
    signal input solHash;

    // Private inputs solutions
    signal input solutions[4];
    signal input salt;
    
    // Outputs
    signal output hash;
    
    var max_chars = 4; //max_characteristics
    
   // Verify that the hash of the private solution matches hash
    component poseidon = Poseidon(5);
    poseidon.inputs[0] <== salt;
    for (var i=0; i<4; i++) {
        poseidon.inputs[i+1] <== solutions[i];
    }
    hash <== poseidon.out;
    solHash === hash;

    component lessThan[12];
    component equals[12];
    component equalsBoard[96];

    //assert ask inputs characteristic
    lessThan[8] = LessThan(4);
    lessThan[8].in[0] <== ask[0];
    lessThan[8].in[1] <== 5; 
    lessThan[8].out === 1;

    //assert ask inputs characteristic to ask
    lessThan[9] = LessThan(4);
    lessThan[9].in[0] <== ask[1];
    lessThan[9].in[1] <== max_chars;
    lessThan[9].out === 1;

    //assert ask inputs characteristic to ask
    lessThan[10] = LessThan(4);
    lessThan[10].in[0] <== ask[2];
    lessThan[10].in[1] <== 2; //boolean
    lessThan[10].out === 1;

    //verify question
    component quinSelector = QuinSelector(4);
    for (var k=0; k< 4; k++) {
        quinSelector.in[k] <== solutions[k];
    }
    quinSelector.index <== ask[0];
    signal d <== quinSelector.out;

    equals[4] = IsEqual();
    equals[4].in[0] <== d; //position
    equals[4].in[1] <== ask[1]; //characteristic
    equals[4].out === ask[2]; //response
   
}

component main {public [ask, solHash ]} =  Question();