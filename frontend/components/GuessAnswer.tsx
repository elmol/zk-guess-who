import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { Avatar, Box, Button, Container, CssBaseline, Grid } from "@mui/material";
import Typography from "@mui/material/Typography";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import CharacterSelector from "./CharacterSelector";
import NumberFormSelect from "./NumberFormSelect";

type Question = {
  position: number;
  number: number;
  guess: string;
  character: string;
};


interface GuessAnswerProps {
  isPendingGuess: boolean | undefined;
  lastGuess: number;
  onGuessSubmit: SubmitHandler<Question>;
  onGuessAnswered: () => () => Promise<void>;
}

export const GuessAnswer = (props: GuessAnswerProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<Question>();

  // prettier-ignore
  const board = [
  [3,1,0,1],[0,1,2,3],[2,0,3,0],[2,0,1,0],[1,2,3,2],[1,3,0,3],
  [2,1,3,0],[3,2,1,0],[2,0,1,3],[0,1,2,1],[3,1,0,2],[3,1,2,1],
  [3,1,2,0],[1,3,2,3],[2,1,3,1],[2,0,3,1],[2,1,0,3],[3,2,0,2],
  [1,3,2,0],[1,3,0,2],[2,1,0,1],[3,2,0,1],[0,1,3,1],[3,2,1,2]
];
  /* eslint-enable */

  function answer(lastAnswer: number) {
    if (lastAnswer === 1) {
      return <CloseIcon />;
    }
    if (lastAnswer === 2) {
      return <CheckIcon />;
    }
    return <QuestionMarkIcon />;
  }

  return (
    <>
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
          <Box component="form" noValidate onSubmit={handleSubmit(props.onGuessSubmit)} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <CharacterSelector id="guess" label="Guess" control={control} defaultValue={"0-1-2-3"} variant="outlined" size="small" characters={board} {...register("guess")}></CharacterSelector>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Avatar variant="rounded"> {answer(props.lastGuess)}</Avatar>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button type="submit" fullWidth variant="contained" disabled={props.isPendingGuess}>
                  guess
                </Button>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button disabled={!props.isPendingGuess} variant="outlined" onClick={props.onGuessAnswered()}>
                  ack
                </Button>
              </Grid>
            </Grid>
          </Box>
          <>{props.isPendingGuess && <Typography variant="body2">Pending guess answer. Waiting for the other player...</Typography>}</>
        </Box>
      </Container>
    </>
  );
};
