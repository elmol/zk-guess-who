import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { Avatar, Box, Button, Container, CssBaseline, Grid } from "@mui/material";
import { green, red } from "@mui/material/colors";
import Typography from "@mui/material/Typography";
import { SubmitHandler, useForm } from "react-hook-form";
import NumberFormSelect from "../components/NumberFormSelect";
import { GameConnection } from "../game/game-connection";

type Question = {
  position: number;
  number: number;
  guess: string;
  character: string;
};

interface QuestionAnswerProps {
  lastNumber: String;
  lastPosition: String;
  isPendingAnswer: boolean | undefined;
  isQuestionTurn: boolean | undefined;
  lastAnswer: number;
  onQuestionSubmit: SubmitHandler<Question>;
  onQuestionAnswered: () => () => Promise<void>;
}

export const QuestionAnswer = (props: QuestionAnswerProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<Question>();

  function answer(lastAnswer: number) {
    if (lastAnswer === 1) {
      return <CloseIcon sx={{ color: red[500] }} />;
    }
    if (lastAnswer === 2) {
      return <CheckIcon sx={{ color: green[500] }} />;
    }
    return <QuestionMarkIcon />;
  }

  const isDisableQuestion = props.isPendingAnswer || !props.isQuestionTurn;
  const numberForm = (
    <>
      {isDisableQuestion ? (
        <b>{props.lastAnswer===3?"?":props.lastNumber}</b>
      ) : (
        <NumberFormSelect id="number" label="Number" control={control} defaultValue="0" variant="outlined" size="small" max={4} {...register("number")} disabled={isDisableQuestion}></NumberFormSelect>
      )}
    </>
  );

  const positionForm = (
    <>
      {isDisableQuestion ? (
        <b>{props.lastAnswer===3?"?":props.lastPosition}</b>
      ) : (
        <NumberFormSelect
          id="position"
          label="Position"
          control={control}
          defaultValue="0"
          variant="outlined"
          size="small"
          max={4}
          {...register("position")}
          disabled={isDisableQuestion}
        ></NumberFormSelect>
      )}
    </>
  );

  return (
    <>
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
            Ask a Question
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit(props.onQuestionSubmit)} sx={{ mt: 3 }}>
            <Grid container>
              <Grid item xs={11} sm={11}>
                <Typography component="h6" variant="h6">
                  Number {numberForm} is in Position {positionForm}
                </Typography>
              </Grid>
              {isDisableQuestion && (
                <Grid item xs={1} sm={1}>
                  <Avatar variant="rounded"> {answer(props.lastAnswer)}</Avatar>
                </Grid>
              )}
              {!isDisableQuestion && (
                <Grid item xs={1} sm={1}>
                  <Button type="submit" fullWidth variant="contained" disabled={isDisableQuestion}>
                    ask
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </Container>
    </>
  );
};
