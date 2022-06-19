import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { Avatar, Box, Button, Container, CssBaseline, Grid } from "@mui/material";
import Typography from "@mui/material/Typography";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import NumberFormSelect from "../components/NumberFormSelect";

type Question = {
  position: number;
  number: number;
  guess: string;
};

interface QuestionAnswerProps {
  isPendingAnswer: boolean | undefined;
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
              <Grid item xs={12} sm={2}>
                <NumberFormSelect id="position" label="Position" control={control} defaultValue="0" variant="outlined" size="small" max={4} {...register("position")}></NumberFormSelect>
              </Grid>
              <Grid item xs={12} sm={2}>
                <NumberFormSelect id="number" label="Number" control={control} defaultValue="0" variant="outlined" size="small" max={4} {...register("number")}></NumberFormSelect>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Avatar variant="rounded"> {answer(props.lastAnswer)}</Avatar>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button type="submit" fullWidth variant="contained" disabled={props.isPendingAnswer}>
                  ask
                </Button>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button disabled={!props.isPendingAnswer} variant="outlined" onClick={props.onQuestionAnswered()}>
                  ack
                </Button>
              </Grid>
            </Grid>
          </Box>
          <>{props.isPendingAnswer && <Typography variant="body2">Pending question answer. Waiting for the other player...</Typography>}</>
        </Box>
      </Container>
    </>
  );
};
