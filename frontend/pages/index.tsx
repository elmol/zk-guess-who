import { Contract, providers } from "ethers";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import Game from "../public/Game.json";
import { GameConnection } from "./game-connection";
import { Avatar, Box, Button, Container, createTheme, CssBaseline, Grid, TextField, ThemeProvider } from "@mui/material";
import { SubmitHandler, useForm } from "react-hook-form";
import Typography from "@mui/material/Typography";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import NumberFormSelect from "../components/NumberFormSelect";

type Question = {
  position: number;
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
    control,
  } = useForm<Question>();

  const [lastAnswer, setLastAnswer] = useState(0);
  const [isPendingAnswer, setIsPendingAnswer] = useState(false);

  const onSubmit: SubmitHandler<Question> = (question) => {
    // const position = parseInt(question.position?.trim() ?? "0");
    const number = parseInt(question.number?.toString()?.trim() ?? "0");
    gameConnection.askQuestion(question.position, number);
  };

  async function onInit() {
    console.log("On init..");
    const provider = new providers.JsonRpcProvider("http://localhost:8545");
    const contract = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Game.abi, provider);
    console.log("Game contract address", contract.address);
  }
  async function connect() {
    console.log("connecting...");
    await gameConnection.init(handleOnQuestionAsked, handleOnQuestionAnswered);
    console.log("game connection initialized");
  }

  async function handleOnQuestionAsked(position: number, number: number) {
    console.log(`Question asked: ${position} ${number}`);
    const lastQuestion = await gameConnection.getLastQuestion();
    console.log("Last question", lastQuestion);
    const lastAnswer = await gameConnection.getLastAnswer();
    console.log(`Answer asked: ${lastAnswer}`);
    if (lastAnswer === 0) {
      setIsPendingAnswer(true);
    } else {
      setIsPendingAnswer(false);
    }
    setLastAnswer(lastAnswer);
  }

  async function handleOnQuestionAnswered(answer: number) {
    console.log(`Answer answered event: ${answer}`);
    const lastAnswer = await gameConnection.getLastAnswer();
    console.log(`Answer answered: ${lastAnswer}`);
    if (lastAnswer === 0) {
      setIsPendingAnswer(true);
    } else {
      setIsPendingAnswer(false);
    }
    setLastAnswer(lastAnswer);
  }

  function answer(lastAnswer: number) {
    if (lastAnswer === 1) {
      return <CloseIcon />;
    }
    if (lastAnswer === 2) {
      return <CheckIcon />;
    }
    return <QuestionMarkIcon />;
  }

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
            <Grid item xs={12} sm={2}>
              <NumberFormSelect id="position" label="Position" control={control} defaultValue="0" variant="outlined" size="small" max={4} {...register("position")}></NumberFormSelect>
            </Grid>
            <Grid item xs={12} sm={2}>
              <NumberFormSelect id="number" label="Number" control={control} defaultValue="0" variant="outlined" size="small" max={4} {...register("number")}></NumberFormSelect>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Avatar variant="rounded"> {answer(lastAnswer)}</Avatar>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button type="submit" fullWidth variant="contained" disabled={isPendingAnswer}>
                ask
              </Button>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                disabled={!isPendingAnswer}
                variant="outlined"
                onClick={async () => {
                  await gameConnection.responseQuestion();
                  setLastAnswer(await gameConnection.getLastAnswer());
                }}
              >
                awk
              </Button>
            </Grid>
          </Grid>
        </Box>
        <>{isPendingAnswer && <Typography variant="body2">Pending question answer. Waiting for the other player...</Typography>}</>
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
        <button onClick={() => connect()}>Connect</button>
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
