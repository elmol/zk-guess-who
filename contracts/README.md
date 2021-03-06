# zkGuessWho Contracts

It includes validations contracts copied from circuits and the `Game` contract which all the game logic.

## Development

Based on typescript HardHat Project

## Deploy to devnet
```
$ npx hardhat run scripts/deploy.ts --network devnet
Deploying contracts with the account: 0x959616dD5CaA900458ED0Af6137Cf1779FF7194F
Account balance: 20017477716340000000000
VerifierBoard deployed to: 0xD2Ef7B400921F51a9A14Bf83A324dc3e4f013D04
VerifierQuestion deployed to: 0x995f673eA7382876Ff8fDc14cBe23C5229d4ba73
VerifierGuess deployed to: 0x9d8262FC1e87e71491E35F8fcE54c715Fd525BcB
Game deployed to: 0x99928B6C25788E1b9d007bB93fF94F1eaF602996
Account balance after deploy: 20017188437620000000000
```

## Deploy to mainnet
```
$ npx hardhat run scripts/deploy.ts --network mainnet
No need to generate any newer typings.
Deploying contracts with the account: 0x959616dD5CaA900458ED0Af6137Cf1779FF7194F
Account balance: 817410094380000000000
VerifierBoard deployed to: 0x84382bf52C3672785F278312bEF90057F49EFcf8
VerifierQuestion deployed to: 0x8dC5F49EdFD2407c2b1eB9A01aaE3f18A044cd4C
VerifierGuess deployed to: 0xE02fF28829360fE0e2E7F747Ccc6aAf13695f63D
Game deployed to: 0x64C58Eb858842F1Ab8fdd4105CDE20eE3510393B
Account balance after deploy: 817111173408000000000
```
## Others hardhat commands

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```