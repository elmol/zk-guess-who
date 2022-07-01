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
Account balance: 917742785140000000000
VerifierBoard deployed to: 0xa79BEAC818e4c040773a5998b1877c256480a0C8
VerifierQuestion deployed to: 0x192D322359359A44D7b953790EC5D8CA312723b1
VerifierGuess deployed to: 0x20aB3Afe643cb5e21e8ECdc2164609b5Dc662083
Game deployed to: 0xab409973de0A3f29F92B8c5138472227F0eb7F94
Account balance after deploy: 917444269772000000000
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