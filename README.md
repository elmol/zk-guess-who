# zkGuessWho Game


**ZKU Cohort 3 Final Project** - [*zkGuessWho*](https://zk-guess-who.vercel.app/) is an on-chain “guess who” game. 

The game is a variant of the “guess who” game https://en.wikipedia.org/wiki/Guess_Who%3F .
A two player game where they try to identify the other’s chosen character. Zk proofs is used
to keep the characters and the game privacy.

A player can get clues from the opponent's character by asking yes/no questions about the character's characteristics.
There is only one chance to guess the opponent's character. If it is guessed, the game is won if not lost.

The broads consist on 24 characters and the character is defined by a set of 4 characteristics with 4 variants each.

Characters are defined by 4 digit number and the characteristics by the positions in this number. For example in a character 2310, the first
characteristic is 2, the second 3... And the questions are for example: is 2 in position 0? (true) or is 1 in position 3? (false)

*dApp:*  https://zk-guess-who.vercel.app/

*demo:* https://youtu.be/R4NqF-TJHcM

## Project Structure

The project the following folders:

- circuits
- contracts
- frontend
- scripts
- docs (to be removed)

### Circuits

The [circuits folder](/circuits/) contains all the circuits.

To learn more about the circuits, read the [README file](/circuits/README.md) inside the `circuits` folder.

### Contracts

The [contracts folder](/contracts/) contains all the smart contracts used in zkGames.

To learn more about the smart contracts, read the [README file](/contracts/README.md) inside the `contracts` folder.

### Frontend

The [frontend folder](/frontend/) contains the dApp frontend.

To learn more about the frontend, read the [README file](/frontend/README.md) in the `frontend` folder.


## Development

### Installation

Install all folders/modules dependencies

```
$ yarn install

```
### Test

Test all modules

```
$ yarn test
```

### Local deployment

Local deploy contracts in hardhat node and dApp 

In a shell console

```
$ cd contracts
$ npx hardhat node
```
In an other console

```
$ yarn dev-deploy
```

### Script Utils

To copy circuits  to contracts
```
$ scripts/copy-circuit-contract.sh 
```
To copy zks utils and abi to frontend

```
$ scripts/copy-zk-frons.sh
```

### Installation Possible Errors

On npm install when trying to install circom_tester dependency
```
$ npm install

npm notice Beginning October 4, 2021, all connections to the npm registry - including for package installation - must use TLS 1.2 or higher. You are currently using plaintext http to connect. Please visit the GitHub blog for more information: https://github.blog/2021-08-23-npm-registry-deprecating-tls-1-0-tls-1-1/
```

Run yarn install instead of npm install

```
$ yarn install
```

## Networks and Contracts Addresses

You can find the networks and contract address in [networks.json](frontend/public/networks.json)

## __`WARNING!!!`__

Browser Local Storage is used to store the game (the salt and selected character) per account if you clear the local store data could be inconsistent and you may __`BLOCK the GAME`__. In this case, please "Quit the game" through the game board link or let me know to free the Room.  


## Future Work

- UI/UX improvements
- Remove answer button unifying answer/ask in one message
- show all characters in a UI board
- Multi room game implementation.
- Random board.
- Graphical characters.
- ...