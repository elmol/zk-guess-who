import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import { GameConnection } from "../game/game-connection";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface EndGameDialogProps {
  open: boolean;
  win: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  gameConnection: GameConnection;
}

export default function AlertDialogSlide(props: EndGameDialogProps) {
  const handleClose = async () => {
    //TODO: HACK TO NOT SHOW GAME OVER NEW GAME
    await props.gameConnection.storeNotPlaying();
    props.setOpen(false);
  };

  return (
    <div>
      <Dialog open={props.open} TransitionComponent={Transition} keepMounted onClose={handleClose} aria-describedby="alert-dialog-slide-description">
        <DialogTitle>{"Game Over"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">You have {props.win ? "WON" : "LOST"}!</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>OK</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
