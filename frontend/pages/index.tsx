import { Contract, providers } from "ethers";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect } from "react";
import styles from "../styles/Home.module.css";
import Game from "../public/Game.json";
import detectEthereumProvider from "@metamask/detect-provider"
import { gameAsk, gameGuess, gameRespond, gameStart, gameWon } from "./game";

const Home: NextPage = () => {
  async function onInit() {
    const provider = new providers.JsonRpcProvider("http://localhost:8545");
    const contract = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Game.abi, provider);
    console.log("on init..");
    console.log("Game contract address", contract.address);
  }

  async function gameConnection() {
    const provider = (await detectEthereumProvider()) as any;
    const ethersProvider = new providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const game = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Game.abi, signer);
    return game;
  }

  async function selection() {
    const game = await gameConnection();
    console.log("Selecting the character");
    try {
      await gameStart([3, 2, 1, 0], 321, game);
      console.log("Character selected!");
      console.log("Game hash:", await game.hash());
    } catch (e) {
      console.log(e);
    }
  }

  async function ask() {
    const game = await gameConnection();
    console.log("Asking for 0,3");
    try {
      await gameAsk(0,3, game);
      console.log("Question asked!");
      console.log("Question done. type:",await game.lastType(),"characteristic:",await game.lastCharacteristic());
    } catch (e) {
      console.log(e);
    }
  }

  async function responseQuestion() {
    const game = await gameConnection();
    console.log("Response 1 for 0,3 question");
    try {
      await gameRespond([3, 2, 1, 0],321,game);
      console.log("Question respond!");
      console.log("Question answer for ",await game.lastType(),"characteristic:",await game.lastCharacteristic(),"is:",await game.lastResponse());
    } catch (e) {
      console.log(e);
    }
  }

  async function guess() {
    const game = await gameConnection();
    console.log("Guess for 3210");
    try {
      await gameGuess([3, 2, 1, 0], game);
      console.log("Guess done!");
      console.log("Last Guess:",await game.lastGuess(0),await game.lastGuess(1),await game.lastGuess(2),await game.lastGuess(3));
    } catch (e) {
      console.log(e);
    }
  }

  async function responseGuess() {
    const game = await gameConnection();
    console.log("Response for 3210 guess");
    try {
      await gameWon([3, 2, 1, 0], 321, game);
      console.log("Guess respond!");
      console.log("Guess answer for",await game.lastGuess(0),await game.lastGuess(1),await game.lastGuess(2),await game.lastGuess(3),"is:",await game.won());
    } catch (e) {
      console.log(e);
    }
  }



  useEffect(() => {
    onInit();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>zkGuessWho</title>
        <meta name="description" content="zkGuessWho game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>zkGuessWho</h1>
        <h1>A ZK Game</h1>
        <div className={styles.description}>Character 3210 will be selected...</div>
        <button onClick={() => selection()}>Select</button>
        <div className={styles.description}>Asking for 0,3...</div>
        <button onClick={() => ask()}>Ask</button>
        <div className={styles.description}>Response 1 for last ask 0,3</div>
        <button onClick={() => responseQuestion()}>Response Ask</button>
        <div className={styles.description}>Guess 3210</div>
        <button onClick={() => guess()}>Guess</button>
        <div className={styles.description}>Response 1 for Guess 3210</div>
        <button onClick={() => responseGuess()}>Response Guess</button>
      </main>

      <footer className={styles.footer}>
        <a href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app" target="_blank" rel="noopener noreferrer">
          Powered by{" "}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
};

export default Home;
