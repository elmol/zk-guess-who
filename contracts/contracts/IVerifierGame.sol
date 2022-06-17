// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVerifierGame {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[10] memory input
    ) external view returns (bool r);
}
