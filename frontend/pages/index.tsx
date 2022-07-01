import { Alert, AppBar, Backdrop, Box, Button, CircularProgress, Container, createTheme, CssBaseline, Link, Paper, ThemeProvider, Toolbar } from "@mui/material";
import Typography from "@mui/material/Typography";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import CharacterSelector from "../components/CharacterSelector";
import AlertDialogSlide from "../components/EndGameDialog";
import { GuessAnswer } from "../components/GuessAnswer";
import { QuestionAnswer } from "../components/QuestionAnswer";
import { QuestionAskAnswer } from "../components/QuestionAskAnswer";
import WalletConnector from "../components/WalletConnector";
import { GameConnection } from "../game/game-connection";
import styles from "../styles/Home.module.css";

type Question = {
  position: number;
  number: number;
  guess: string;
  character: string;
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
  // Game Flow states
  const [isStarted, setIsStarted] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [isPlayerInGame, setIsPlayerInGame] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  // Game Board states
  const [lastAnswer, setLastAnswer] = useState(0);
  const [lastGuess, setLastGuess] = useState(0);

  const [isPendingAnswer, setIsPendingAnswer] = useState(false);
  const [isPendingGuess, setIsPendingGuess] = useState(false);

  const [isAnswerTurn, setAnswerTurn] = useState(false);
  const [isQuestionTurn, setQuestionTurn] = useState(false);

  // Main Board states
  const [open, setOpen] = useState(false);

  const [isWaiting, setIsWaiting] = useState(false);

  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [lastNumber, setLastNumber] = useState("0");
  const [lastPosition, setLastPosition] = useState("0");

  //////////////////////////////////////////////////////////////////////////////

  const theme = createTheme({
    typography: {
      fontFamily: `"Caveat Brush", "Helvetica", "Arial", sans-serif`,
      fontSize: 22,

      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
    },
    palette: {
      background: {
        paper: "#e0f8f4",
      },
      primary: {
        main: "#97266E",
      },
    },
   
  });

  // REGISTRATION CONTROLLERS ----------------------------------------------------------------
  const onCreateGame: SubmitHandler<Question> = async (selection) => {
    setIsWaiting(true);
    setError(false);
    try {
      //set defaults selection
      selection.character = selection.character ? selection.character : "0-1-2-3";
      const character = selection.character.split("-").map((n: string) => parseInt(n.trim()));
      await gameConnection.createOrJoin(character);
      setIsStarted(await gameConnection.isStarted());
      setIsCreated(await gameConnection.isCreated());
      setIsPlayerInGame(await gameConnection.isPlayerInGame());
    } catch (e: any) {
      setError(true);
      setErrorMsg(e.message);
    }
    setIsWaiting(false);
  };

  // GAME BOARD CONTROLLERS ----------------------------------------------------------------
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

  const onQuestionSubmit: SubmitHandler<Question> = async (question) => {
    setIsWaiting(true);
    setError(false);

    //set defaults question
    question.number = question.number ? question.number : 0;
    question.position = question.position ? question.position : 0;
    try {
      await gameConnection.question(question.position, question.number);
    } catch (e: any) {
      setError(true);
      setErrorMsg(e.message);
    }

    setIsWaiting(false);
  };

  function onAllAnswered() {
    return async () => {
      setIsWaiting(true);
      setError(false);
      try {
        await gameConnection.answerAll();
        setLastAnswer(await gameConnection.getLastAnswer());
        setLastGuess(await gameConnection.getLastGuessAnswer());
        await onHandleEndOfGame();
      } catch (e: any) {
        setError(true);
        setErrorMsg(e.message);
      }

      setIsWaiting(false);
    };
  }

  function onQuitGame() {
    return async () => {
      setIsWaiting(true);
      setError(false);
      try {
        await gameConnection.quit();
        setIsStarted(false);
        setIsCreated(false);
        setIsPlayerInGame(false);
      } catch (e: any) {
        setError(true);
        setErrorMsg(e.message);
      }

      setIsWaiting(false);
    };
  }

  //////////////////////////////////////////////////////////////////////////////

  async function onInit() {}

  async function connect(): Promise<void> {
    console.log("connecting...");

    await gameConnection.init(handleOnQuestionAsked, handleOnQuestionAnswered, handleOnGuess, handleOnGuessResponse, handleOnJoined, handleOnCreated);

    // init properties
    setLastAnswer(await gameConnection.getLastAnswer());
    setLastGuess(await gameConnection.getLastGuessAnswer());
    setIsStarted(await gameConnection.isStarted());
    setAnswerTurn(await gameConnection.isAnswerTurn());
    setQuestionTurn(await gameConnection.isQuestionTurn());
    setIsCreated(await gameConnection.isCreated());
    setIsPlayerInGame(await gameConnection.isPlayerInGame());
    setIsWinner(await gameConnection.isWinner());
    const lastQuestion = await gameConnection.getLastQuestion();
    setLastPosition(lastQuestion.type);
    setLastNumber(lastQuestion.characteristic);
    updateQuestionState();
    updateGuessState();

    console.log("game connection initialized");
  }

  // handle questions
  async function handleOnQuestionAsked(position: number, number: number) {
    console.log(`Question asked: ${position} ${number}`);
    await updateQuestionState();
  }

  async function handleOnQuestionAnswered(answer: number) {
    console.log(`Answer answered event: ${answer}`);
    await updateQuestionState();
  }

  async function updateQuestionState() {
    const lastAnswer = await gameConnection.getLastAnswer();
    setLastAnswer(lastAnswer);
    if (lastAnswer === 0) {
      setIsPendingAnswer(true);
    } else {
      setIsPendingAnswer(false);
    }
    setQuestionTurn(await gameConnection.isQuestionTurn());
  }

  // handle guesses
  async function handleOnGuess(guess: number[]) {
    await updateGuessState();
  }

  async function handleOnGuessResponse(answer: number) {
    await updateGuessState();
    await onHandleEndOfGame();
  }

  async function updateGuessState() {
    const lastGuess = await gameConnection.getLastGuessAnswer();
    if (lastGuess === 0) {
      setIsPendingGuess(true);
    } else {
      setIsPendingGuess(false);
    }
    setLastGuess(lastGuess);
    setQuestionTurn(await gameConnection.isQuestionTurn());
  }

  async function onHandleEndOfGame() {
    setIsPlayerInGame(await gameConnection.isPlayerInGame());
    const lastAnswer = await gameConnection.getLastGuessAnswer();
    if (lastAnswer !== 0 && lastAnswer !== 3) {
      setIsWinner(await gameConnection.isWinner());
      const playing = await gameConnection.isStoredPlaying();
      if (playing) {
        setOpen(true);
      }
    }
  }

  // handle registration
  async function handleOnCreated() {
    setIsStarted(await gameConnection.isStarted());
    setIsCreated(await gameConnection.isCreated());
    setIsPlayerInGame(await gameConnection.isPlayerInGame());
    await updateQuestionState();
    await updateGuessState();
  }

  async function handleOnJoined() {
    setIsStarted(await gameConnection.isStarted());
    setIsCreated(await gameConnection.isCreated());
    setIsPlayerInGame(await gameConnection.isPlayerInGame());
    await updateQuestionState();
    await updateGuessState();
  }

  useEffect(() => {
    onInit();
  }, []);

  //VIEW COMPONENTS ----------------------------------------------------------------
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<Question>();

  // GAME BOARD COMPONENT ----------------------------------------------------------------
  const isPendingSomeAnswer = isPendingAnswer || isPendingGuess;
  const isAnswerNeeded = isPendingSomeAnswer && isAnswerTurn;
  const isCurrentTurn = (!isAnswerTurn && !isPendingSomeAnswer) || isAnswerNeeded;
  const isOpponentTurn = !isCurrentTurn;

  const opponentTurnComponent = (
    <Typography variant="h4" align="center" marginTop={4}>
      <Alert severity="info">Opponent Turn. Waiting for the other player...</Alert>
    </Typography>
  );

  const answerComponent = (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Answer to your opponent
        </Typography>
        <Button variant="outlined" onClick={onAllAnswered()} sx={{ marginTop: 2 }}>
          Answer
        </Button>
      </Box>
    </Container>
  );

  const askComponent = (
    <>
      {/* if not guessing show question component */}
      {!isPendingGuess && (
        <QuestionAskAnswer
          lastPosition={lastPosition}
          lastNumber={lastNumber}
          isQuestionTurn={isQuestionTurn}
          isPendingAnswer={isPendingSomeAnswer}
          lastAnswer={lastAnswer}
          onQuestionSubmit={onQuestionSubmit}
          onQuestionAnswered={onAllAnswered}
        />
      )}

      {/* if guessing show guess component */}
      {!isPendingAnswer && isQuestionTurn && (
        <GuessAnswer isQuestionTurn={isQuestionTurn} isPendingGuess={isPendingSomeAnswer} lastGuess={lastGuess} onGuessSubmit={onGuessSubmit} onGuessAnswered={onAllAnswered} />
      )}
    </>
  );
  const gameBoardComponent = (
    <>
      {/* if opponent turn show opponent turn message */}
      {isOpponentTurn && opponentTurnComponent}
      {/* if answer turn show answer component */}
      {isAnswerNeeded && answerComponent}
      {/* if question turn show question component */}
      {!isAnswerNeeded && askComponent}
      {/* link to quit the game */}
      <Typography align="right">
        <Link component="button" variant="body1" onClick={onQuitGame()} sx={{ marginTop: 2 }}>
          Quit the game
        </Link>
      </Typography>
    </>
  );

  // REGISTRATION COMPONENT ----------------------------------------------------------------
  const registrationComponent = (
    <>
      <Box component="form" noValidate onSubmit={handleSubmit(onCreateGame)} sx={{ mt: 3 }}>
        <Typography component="h4" variant="h5" align="center">
          Choose your Number
        </Typography>
        <Typography component="h4" variant="h4" align="center" marginTop={3}>
          <CharacterSelector
            id="select"
            label="Number"
            control={control}
            defaultValue={"0-1-2-3"}
            variant="outlined"
            size="small"
            characters={board}
            disabled={isPlayerInGame}
            {...register("character")}
          ></CharacterSelector>
        </Typography>
        {isPlayerInGame ? (
          <>
            <Typography align="center" component={"span"} variant="body2" marginTop={2}>
              <Alert severity="info">Waiting for another player to join...</Alert>
            </Typography>
          </>
        ) : (
          <Typography align="center" marginTop={2}>
            <Button type="submit" variant="outlined">
              {isCreated ? "Join Game" : "Create New Game"}
            </Button>
          </Typography>
        )}
      </Box>
    </>
  );

  // GAME FULL COMPONENT ----------------------------------------------------------------
  const gameRoomFullComponent = (
    <Typography variant="h4" align="center" marginTop={4}>
      <Alert severity="warning">Game Room is full, please try later....</Alert>
    </Typography>
  );

  // MAIN PAGE  ----------------------------------------------------------------
  const loggingComponent = (
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

  //MAIN FLOW
  /* if not started show registration component  */
  const isShowRegister = !isStarted;
  /* if the player is playing show game board */
  const isShowGameBoard = isStarted && isPlayerInGame;
  /* if the Game Room is full show game room full alert */
  const isShowGameRoomFull = isStarted && !isPlayerInGame;
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
          color="transparent"
          elevation={10}
          sx={{
            position: "relative",
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Toolbar sx={{ flexWrap: "wrap" }}>
            <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}  marginTop={2}>
              <Image src="/guesswho.svg" alt="zkGuessWho" width={200} height={50} />
            </Typography>
            <WalletConnector connectionHandle={connect} />
          </Toolbar>
        </AppBar>

        <Container component="main" maxWidth="md" sx={{ mb: 4 }}>
          <Paper elevation={15} sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
            <Typography component="h1" variant="h4" align="center" margin={2}>
              <Image src="/guesswho.svg" alt="zkGuessWho" width={500} height={150} />
            </Typography>

            {isShowRegister && registrationComponent}
            {isShowGameBoard && gameBoardComponent}
            {isShowGameRoomFull && gameRoomFullComponent}
          </Paper>
        </Container>

        {loggingComponent}
        {error ? (
          <Alert severity="error" sx={{ textAlign: "left" }}>
            {errorMsg}
          </Alert>
        ) : (
          <div />
        )}
        <AlertDialogSlide open={open} setOpen={setOpen} win={isWinner} gameConnection={gameConnection}></AlertDialogSlide>
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
