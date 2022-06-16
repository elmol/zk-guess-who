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

template Board() {
    // Public inputs guess
    signal input solHash;

    // Private inputs solutions
    signal input solutions[4];
    signal input salt;
    
    // Outputs
    signal output hash;
    
    var max_chars = 4; //max_characteristics
    
    //default board assignation
    var default_board[24][max_chars] = [
        [3,1,0,1],[0,1,2,3],[2,0,3,0],[2,0,1,0],[1,2,3,2],[1,3,0,3],
        [2,1,3,0],[3,2,1,0],[2,0,1,3],[0,1,2,1],[3,1,0,2],[3,1,2,1],
        [3,1,2,0],[1,3,2,3],[2,1,3,1],[2,0,3,1],[2,1,0,3],[3,2,0,2],
        [1,3,2,0],[1,3,0,2],[2,1,0,1],[3,2,0,1],[0,1,3,1],[3,2,1,2]
    ];
    
    component lessThan[12];
    component equals[12];
    component equalsBoard[96];

    //assert max characteristic (6)
    for (var i=0; i<4; i++) {
        lessThan[i+4] = LessThan(4);
        lessThan[i+4].in[0] <== solutions[i];
        lessThan[i+4].in[1] <== max_chars;
        lessThan[i+4].out === 1;
    }

    //assert solution is in the board
    signal equalCharacter[24];
    signal equal2Chars[24][2];
    for (var i=0; i<24; i++) {
        for(var j=0; j<4; j++) {
            equalsBoard[i*4+j] = IsEqual();
            equalsBoard[i*4+j].in[0] <== default_board[i][j];
            equalsBoard[i*4+j].in[1] <== solutions[j];
        }
        //is the character
        equal2Chars[i][0] <==  equalsBoard[i*4+0].out * equalsBoard[i*4+1].out;
        equal2Chars[i][1] <==  equalsBoard[i*4+2].out * equalsBoard[i*4+3].out;
        equalCharacter[i] <==  equal2Chars[i][0] * equal2Chars[i][1];
    }

    //assert should be in the board and should be only one; 
    var onlyOneCharacter = 0;
    for (var i=0; i<24; i++) {
        onlyOneCharacter = onlyOneCharacter + equalCharacter[i];
    }
    onlyOneCharacter === 1;

    // Verify that the hash of the private solution matches hash
    component poseidon = Poseidon(5);
    poseidon.inputs[0] <== salt;
    for (var i=0; i<4; i++) {
        poseidon.inputs[i+1] <== solutions[i];
    }
    hash <== poseidon.out;
    solHash === hash;
}

component main {public [ solHash ]} =  Board();