import { Contract, providers } from "ethers";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { FormEvent, useEffect } from "react";
import styles from "../styles/Home.module.css";
import Game from "../public/Game.json";
import { GameConnection } from "./game-connection";
import { Box, Button, Container, createTheme, CssBaseline, Grid, TextField, ThemeProvider } from "@mui/material";
import { SubmitHandler, useForm } from "react-hook-form";
import Typography from "@mui/material/Typography";

type Question = {
  position: string;
  number: string;
};

const Home: NextPage = () => {
  const theme = createTheme();

  const gameConnection = new GameConnection();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Question>();

  const onSubmit: SubmitHandler<Question> = (question) => {
    const position = parseInt(question.position?.trim() ?? "0");
    const number = parseInt(question.number?.toString()?.trim() ?? "0");
    gameConnection.askQuestion(position, number);
  };

  async function onInit() {
    const provider = new providers.JsonRpcProvider("http://localhost:8545");
    const contract = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Game.abi, provider);
    console.log("on init..");
    console.log("Game contract address", contract.address);
  }

  // function handleAsk(event: FormEvent<HTMLFormElement>) {
  //   event.preventDefault();
  //   const data = new FormData(event.currentTarget);
  //   const position = parseInt(data.get("position")?.toString()?.trim() ?? "0");
  //   const number = parseInt(data.get("number")?.toString()?.trim() ?? "0");
  //   gameConnection.askQuestion(position, number);
  // }

  useEffect(() => {
    onInit();
  }, []);

  const questionAsk = (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Ask about the position and number
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField autoComplete="position" required id="position" label="Position" size="small" {...register("position") } autoFocus />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField autoComplete="number" required id="number" label="Number" size="small" {...register("number") } autoFocus />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button type="submit" fullWidth variant="contained">
                ask
              </Button>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Button variant="outlined" onClick={() => gameConnection.responseQuestion()}>
                awk
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
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
        <button onClick={() => gameConnection.selection()}>Select</button>

        <ThemeProvider theme={theme}>{questionAsk}</ThemeProvider>
        <div className={styles.description}>Guess 3210</div>
        <button onClick={() => gameConnection.guess()}>Guess</button>
        <div className={styles.description}>Response 1 for Guess 3210</div>
        <button onClick={() => gameConnection.responseGuess()}>Response Guess</button>
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
