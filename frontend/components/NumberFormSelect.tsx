import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { forwardRef } from "react";
import { Controller } from "react-hook-form";

type FromProps = React.HTMLProps<HTMLFormElement>;
// eslint-disable-next-line react/display-name
const NumberFormSelect = forwardRef<HTMLFormElement, FromProps>(({ name, label, control, defaultValue, max, ...props }, ref) => {
  const labelId = `${name}-label`;
  return (
    <FormControl {...props}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Controller
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <Select labelId={labelId} label={label} value={value} onBlur={onBlur} onChange={onChange}>
            {Array.from(Array(max).keys()).map((n: number) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        )}
        name={name||"default-name"}
        control={control}
        defaultValue={defaultValue}
      />
    </FormControl>
  );
});
export default NumberFormSelect;
