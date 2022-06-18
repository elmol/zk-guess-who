pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/comparators.circom"; // relative path form artifact/circuits
include "../node_modules/circomlib/circuits/poseidon.circom";  // relative path form artifact/circuits

template Guess() {
    // Public inputs guess
    signal input guess[4];
    signal input solHash;

    // Private inputs solutions
    signal input solutions[4];
    signal input salt;
    
    // Outputs
    signal output win; //1 win 0 lose
    
    var max_chars = 4; //max_characteristics


    // Verify that the hash of the private solution matches hash
    component poseidon = Poseidon(5);
    poseidon.inputs[0] <== salt;
    for (var i=0; i<4; i++) {
        poseidon.inputs[i+1] <== solutions[i];
    }
    solHash === poseidon.out;

   
    component lessThan[4];
    component equals[4];

    //assert max characteristic
    for (var i=0; i<4; i++) {
        lessThan[i] = LessThan(4);
        lessThan[i].in[0] <== guess[i];
        lessThan[i].in[1] <== max_chars;
        lessThan[i].out === 1;
    }

    //assert win/lose 
    for (var i=0; i<4; i++) {
            equals[i] = IsEqual();
            equals[i].in[0] <== guess[i];
            equals[i].in[1] <== solutions[i];
    }
    signal first <==  equals[0].out * equals[1].out;
    signal second <== equals[2].out * equals[3].out;
    win <== first * second;
}

component main {public [guess, solHash ]} =  Guess();