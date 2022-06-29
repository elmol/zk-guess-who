import { Box, Button, Container, CssBaseline, Grid } from "@mui/material";
import Typography from "@mui/material/Typography";
import { SubmitHandler, useForm } from "react-hook-form";
import CharacterSelector from "./CharacterSelector";

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
  isQuestionTurn: boolean | undefined;
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

  // guess is disable is not the turn for guessing
  const isDisableGuess = props.isPendingGuess || !props.isQuestionTurn;

  return (
    <>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h5">
          {isDisableGuess?"Bet Number":"Guess a Number"}
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit(props.onGuessSubmit)} sx={{ mt: 3 }}>
            <Grid container>
              <Grid item xs={8} sm={8}>
                <CharacterSelector
                  disabled={isDisableGuess}
                  align="center"
                  id="guess"
                  label="Guess"
                  control={control}
                  defaultValue={"0-1-2-3"}
                  variant="outlined"
                  size="small"
                  characters={board}
                  {...register("guess")}
                ></CharacterSelector>
              </Grid>
              <Grid item xs={4} sm={4}>
                <Button type="submit" fullWidth variant="contained" disabled={isDisableGuess}>
                  guess
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </>
  );
};
