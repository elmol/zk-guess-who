import { Contract, providers } from "ethers";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect } from "react";
import styles from "../styles/Home.module.css";
import Game from "../public/Game.json";
import detectEthereumProvider from "@metamask/detect-provider"
import { gameStart } from "./game";

const Home: NextPage = () => {
  async function onInit() {
    const provider = new providers.JsonRpcProvider("http://localhost:8545");
    const contract = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Game.abi, provider);
    console.log("on init..");
    console.log("Game contract address", contract.address);
  }

  async function selection() {
    const provider = (await detectEthereumProvider()) as any
    await provider.request({ method: "eth_requestAccounts" });
    const ethersProvider = new providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const game = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Game.abi, signer);
    console.log("Selecting the character");
    try {
      await gameStart([3, 2, 1, 0], 321, game);
      console.log("Character selected!");
      console.log("Game hash:", await game.hash());
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
        <h1>Select a Character</h1>
        <div className={styles.description}>Character 3210 will be selected...</div>
        <button onClick={() => selection()}>Select</button>
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
