import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { Avatar, Box, Button, Container, CssBaseline, Grid } from "@mui/material";
import { green, red } from "@mui/material/colors";
import Typography from "@mui/material/Typography";
import { SubmitHandler, useForm } from "react-hook-form";
import NumberFormSelect from "../components/NumberFormSelect";
import { GameConnection } from "../game/game-connection";
import DataFormSelect from "./DataFormSelect";
import characters from "../public/characters.json";
import { useEffect } from "react";

type Question = {
  position: number;
  number: number;
  guess: string;
  character: string;
};

interface QuestionAskAnswerProps {
  lastNumber: string;
  lastPosition: string;
  isPendingAnswer: boolean | undefined;
  isQuestionTurn: boolean | undefined;
  lastAnswer: number;
  onQuestionSubmit: SubmitHandler<Question>;
  onQuestionAnswered: () => () => Promise<void>;
}

export const QuestionAskAnswer = (props: QuestionAskAnswerProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
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

  // Character mappings functions
  const data = characters.questions;
  function getTypeOptions() {
    return data.map((type) => {
      return {
        id: type.id,
        name: type.name,
      };
    });
  }

  function getCharsOptions(typeId: number) {
    const filtered = data
      .find((type) => {
        if (type === undefined) return false;
        if (type.id === undefined) return false;
        return type.id === typeId;
      })
      ?.options.map((option) => {
        return {
          id: option.id,
          name: option.name,
        };
      });
    if (filtered === undefined) return [];
    return filtered;
  }

  function getTypeName(optionId: number) {
    return data.find((type) => type.id === optionId)?.name;
  }
  function getCharName(typeId: number, optionId: number) {
    return getCharsOptions(typeId).find((char) => char.id === optionId)?.name;
  }
  const watchPosition = watch("position", 0);

  useEffect(() => {
    setValue("number", 0);
    setValue("position", 0);
  }, []);

  useEffect(() => {
    setValue("number", 0);
  }, [watchPosition]);

  const isDisableQuestion = props.isPendingAnswer || !props.isQuestionTurn;
  const isRecentlyStarted = isDisableQuestion && props.lastAnswer === 3;
  const numberForm = (
    <>
      {isDisableQuestion ? (
        <b>{props.lastAnswer === 3 ? "?" : getCharName(parseInt(props.lastPosition), parseInt(props.lastNumber))}</b>
      ) : (
        <DataFormSelect
          id="number"
          // label="Number"
          control={control}
          defaultValue={0}
          variant="standard"
         // size="small"
          data={getCharsOptions(watchPosition)}
          {...register("number")}
          disabled={false}
          sx={{ mt: -1.5 }}
        ></DataFormSelect>
      )}
    </>
  );

  const positionForm = (
    <>
      {isDisableQuestion ? (
        <b>{props.lastAnswer === 3 ? "?" : getTypeName(parseInt(props.lastPosition))}</b>
      ) : (
        <DataFormSelect
          id="position"
          // label="Position"
          control={control}
          defaultValue={0}
          variant="standard"
       //   size="small"
          data={getTypeOptions()}
          {...register("position")}
          disabled={false}
          sx={{ mt: -1.5 }}
        ></DataFormSelect>
      )}
    </>
  );

  return (
    <>
      <Container component="main" maxWidth="md">
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
            {isDisableQuestion ? "Last Question" : "Ask a Question"}
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit(props.onQuestionSubmit)} sx={{ mt: 2 }}>
            <Grid container>
              <Grid item xs={11} sm={11}>
                <Typography component="h6" variant="h6">
                  {isRecentlyStarted ? (
                    <span> Waiting for a question </span>
                  ) : (
                    <span>
                      Is your character {positionForm} {numberForm} ?
                    </span>
                  )}
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
