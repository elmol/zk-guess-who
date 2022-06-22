import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";

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
}

export default function AlertDialogSlide(props: EndGameDialogProps) {
  const handleClose = () => {
    //TODO: HACK TO NOT SHOW GAME OVER NEW GAME
    const finished = localStorage.getItem("Playing");
    console.log("END-GAME: AFTER REMOVE characterStorage", finished);
    localStorage.removeItem("Playing");
    const finished2 = localStorage.getItem("Playing");
    console.log("END-GAME: BEFORE REMOVE characterStorage", finished2);
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
