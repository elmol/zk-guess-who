import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { Avatar, Box, Button, Container, CssBaseline, Grid } from "@mui/material";
import Typography from "@mui/material/Typography";
import React from "react";
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
            Ask about the position and number
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit(props.onQuestionSubmit)} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={4} sm={4}>
                <NumberFormSelect
                  id="position"
                  label="Position"
                  control={control}
                  defaultValue="0"
                  variant="outlined"
                  size="small"
                  max={4}
                  {...register("position")}
                  disabled={props.isPendingAnswer || !props.isQuestionTurn}
                ></NumberFormSelect>
              </Grid>
              <Grid item xs={4} sm={4}>
                <NumberFormSelect
                  id="number"
                  label="Number"
                  control={control}
                  defaultValue="0"
                  variant="outlined"
                  size="small"
                  max={4}
                  {...register("number")}
                  disabled={props.isPendingAnswer || !props.isQuestionTurn}
                ></NumberFormSelect>
              </Grid>
              {(props.isPendingAnswer || !props.isQuestionTurn) && (
                <Grid item xs={4} sm={4}>
                  <Avatar variant="rounded"> {answer(props.lastAnswer)}</Avatar>
                </Grid>
              )}
              {!(props.isPendingAnswer || !props.isQuestionTurn) && (
                <Grid item xs={4} sm={4}>
                  <Button type="submit" fullWidth variant="contained" disabled={props.isPendingAnswer || !props.isQuestionTurn}>
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
