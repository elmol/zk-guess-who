import { Contract, providers } from "ethers";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import Game from "../public/Game.json";
import { GameConnection } from "../game/game-connection";
import { Alert, AppBar, Avatar, Backdrop, Box, Button, CircularProgress, Container, createTheme, CssBaseline, Grid, Paper, TextField, ThemeProvider, Toolbar } from "@mui/material";
import { SubmitHandler, useForm } from "react-hook-form";
import Typography from "@mui/material/Typography";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import NumberFormSelect from "../components/NumberFormSelect";
import CharacterSelector from "../components/CharacterSelector";
import WalletConnector from "../components/WalletConnector";
import { QuestionAnswer } from "../components/QuestionAnswer";

type Question = {
  position: number;
  number: number;
  guess: string;
};

/* eslint-disable */
// prettier-ignore
const board = [
  [3,1,0,1],[0,1,2,3],[2,0,3,0],[2,0,1,0],[1,2,3,2],[1,3,0,3],
  [2,1,3,0],[3,2,1,0],[2,0,1,3],[0,1,2,1],[3,1,0,2],[3,1,2,1],
  [3,1,2,0],[1,3,2,3],[2,1,3,1],[2,0,3,1],[2,1,0,3],[3,2,0,2],
  [1,3,2,0],[1,3,0,2],[2,1,0,1],[3,2,0,1],[0,1,3,1],[3,2,1,2]
];
/* eslint-enable */

const gameConnection = new GameConnection();

const Home: NextPage = () => {
  const theme = createTheme();
  console.log("new game connection", gameConnection);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<Question>();

  const [lastAnswer, setLastAnswer] = useState(0);
  const [lastGuess, setLastGuess] = useState(0);

  const [isPendingAnswer, setIsPendingAnswer] = useState(false);
  const [isPendingGuess, setIsPendingGuess] = useState(false);

  const [isWaiting, setIsWaiting] = useState(false);

  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function onCreateGame() {
    return async () => {
      try {
        setIsWaiting(true);
        setError(false);
        await gameConnection.selection();
      } catch (e: any) {
        setError(true);
        setErrorMsg(e.message);
      }
      setIsWaiting(false);
    };
  }

  const onGuessSubmit: SubmitHandler<Question> = async (question) => {
    setIsWaiting(true);
    setError(false);

    //set defaults question guess|
    question.guess = question.guess ? question.guess : "0-1-2-3";

    const guess = question.guess.split("-").map((n: string) => parseInt(n.trim()));
    try {
      await gameConnection.guess(guess);
    } catch (e: any) {
      setError(true);
      setErrorMsg(e.message);
    }

    setIsWaiting(false);
  };

  function onGuessAnswered() {
    return async () => {
      setIsWaiting(true);
      setError(false);
      try {
        await gameConnection.responseGuess();
        setLastGuess(await gameConnection.getLastGuessResponse());
      } catch (e: any) {
        setError(true);
        setErrorMsg(e.message);
      }

      setIsWaiting(false);
    };
  }

  async function onInit() {
    // console.log("On init..");
    // const provider = new providers.JsonRpcProvider("http://localhost:8545");
    // const contract = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Game.abi, provider);
    // console.log("Game contract address", contract.address);
  }

  async function connect(): Promise<void> {
    console.log("connecting...");

    await gameConnection.init(handleOnQuestionAsked, handleOnQuestionAnswered, handleOnGuess, handleOnGuessResponse);

    // init properties
    setLastAnswer(await gameConnection.getLastAnswer());
    setLastGuess(await gameConnection.getLastGuessResponse());

    console.log("game connection initialized");
  }

  async function handleOnQuestionAsked(position: number, number: number) {
    console.log(`Question asked: ${position} ${number}`);
    await updateQuestionState();
  }

  async function handleOnQuestionAnswered(answer: number) {
    console.log(`Answer answered event: ${answer}`);
    await updateQuestionState();
  }

  async function updateQuestionState() {
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

  async function handleOnGuess(guess: number[]) {
    console.log(`Last Guess Event: ${guess}`);
    await updateGuessState();
  }

  async function handleOnGuessResponse(answer: number) {
    console.log(`Last Guess Response event: ${answer}`);
    await updateGuessState();
  }

  async function updateGuessState() {
    const lastQuestion = await gameConnection.getLastGuess();
    console.log("Last Guess", lastQuestion);
    const lastAnswer = await gameConnection.getLastGuessResponse();
    console.log(`Last Guess Response: ${lastAnswer}`);
    if (lastAnswer === 0) {
      setIsPendingGuess(true);
    } else {
      setIsPendingGuess(false);
    }
    setLastGuess(lastAnswer);
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


  const onQuestionSubmit: SubmitHandler<Question> = async (question) => {
    setIsWaiting(true);
    setError(false);

    //set defaults question
    question.number = question.number ? question.number : 0;
    question.position = question.position ? question.position : 0;
    try {
      await gameConnection.askQuestion(question.position, question.number);
    } catch (e: any) {
      setError(true);
      setErrorMsg(e.message);
    }

    setIsWaiting(false);
  };

  function onQuestionAnswered() {
    return async () => {
      setIsWaiting(true);
      setError(false);

      try {
        await gameConnection.responseQuestion();
        setLastAnswer(await gameConnection.getLastAnswer());
      } catch (e: any) {
        setError(true);
        setErrorMsg(e.message);
      }

      setIsWaiting(false);
    };
  }

  const guessAsk = (
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
          Guess a Number
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit(onGuessSubmit)} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <CharacterSelector id="guess" label="Guess" control={control} defaultValue={"0-1-2-3"} variant="outlined" size="small" characters={board} {...register("guess")}></CharacterSelector>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Avatar variant="rounded"> {answer(lastGuess)}</Avatar>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button type="submit" fullWidth variant="contained" disabled={isPendingGuess}>
                guess
              </Button>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button disabled={!isPendingGuess} variant="outlined" onClick={onGuessAnswered()}>
                ack
              </Button>
            </Grid>
          </Grid>
        </Box>
        <>{isPendingGuess && <Typography variant="body2">Pending guess answer. Waiting for the other player...</Typography>}</>
      </Box>
    </Container>
  );

  const logging = (
    <>
      {isWaiting ? (
        <Backdrop open={true}>
          <CircularProgress size={100} disableShrink />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption" component="div" color="common.white">
              Waiting
            </Typography>
          </Box>
        </Backdrop>
      ) : (
        <div />
      )}
    </>
  );

  return (
    <div>
      <Head>
        <title>zkGuessWho</title>
        <meta name="description" content="zkGuessWho game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ThemeProvider theme={theme}>
        <CssBaseline />

        <AppBar
          position="absolute"
          color="default"
          elevation={0}
          sx={{
            position: "relative",
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Toolbar sx={{ flexWrap: "wrap" }}>
            <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
              zkGuessWho
            </Typography>
            <WalletConnector connectionHandle={connect} />
          </Toolbar>
        </AppBar>

        <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
          <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
            <Typography component="h1" variant="h4" align="center">
              zkGuessWho
            </Typography>
            <Typography align="center">
              <Button onClick={onCreateGame()}>Create New Game</Button>
            </Typography>
            <QuestionAnswer isPendingAnswer={isPendingAnswer} lastAnswer={lastAnswer} onQuestionSubmit={onQuestionSubmit} onQuestionAnswered={onQuestionAnswered}/>
            {guessAsk}
          </Paper>
        </Container>
        {logging}
        {error ? (
          <Alert severity="error" sx={{ textAlign: "left" }}>
            {errorMsg}
          </Alert>
        ) : (
          <div />
        )}
      </ThemeProvider>
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
