pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/comparators.circom"; // relative path form artifact/circuits
include "../node_modules/circomlib/circuits/poseidon.circom";  // relative path form artifact/circuits

template Board() {
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
    
    component lessThan[4];
    component equalsBoard[96];

    //assert max characteristic 
    for (var i=0; i<4; i++) {
        lessThan[i] = LessThan(4);
        lessThan[i].in[0] <== solutions[i];
        lessThan[i].in[1] <== max_chars;
        lessThan[i].out === 1;
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
}

component main =  Board();