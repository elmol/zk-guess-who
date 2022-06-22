# zkGuessWho Contracts

It includes validations contracts copied from circuits and the `Game` contract which all the game logic.

## Development

Based on typescript HardHat Project

## Deploy to devnet
```
$ npx hardhat run scripts/deploy.ts --network devnet
No need to generate any newer typings.
Deploying contracts with the account: 0x959616dD5CaA900458ED0Af6137Cf1779FF7194F
Account balance: 10010000000000000000000
Game deployed to: 0x192D322359359A44D7b953790EC5D8CA312723b1
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