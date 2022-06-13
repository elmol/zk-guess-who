import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { forwardRef } from "react";
import { Controller } from "react-hook-form";

type FromProps = React.HTMLProps<HTMLFormElement>;
// eslint-disable-next-line react/display-name
const NumberFormSelect = forwardRef<HTMLFormElement, FromProps>(({ name, label, control, defaultValue, characters, ...props }, ref) => {
  const labelId = `${name}-label`;

  function mapCharacter(character: number[]) {
    return character.map((n: number) => n.toString()).join("-");
  }

  return (
    <FormControl {...props}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Controller
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <Select labelId={labelId} label={label} value={value} onBlur={onBlur} onChange={onChange}>
           { characters?.map((character: number[]) => (
              <MenuItem key={mapCharacter(character)} value={mapCharacter(character)}>
                {character[0]} {character[1]} {character[2]} {character[3]}
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
