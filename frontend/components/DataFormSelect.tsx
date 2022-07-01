import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { forwardRef } from "react";
import { Controller } from "react-hook-form";

type FromControllerProps = React.HTMLProps<HTMLFormElement> & { control: typeof Controller | undefined };
// eslint-disable-next-line react/display-name
const DataFormSelect = forwardRef<any, any>(({ name, label, control, defaultValue, data, ...props }, ref) => {
  const labelId = `${name}-label`;

  return (
    <FormControl {...props}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Controller
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <Select labelId={labelId} label={label} value={data.find((item:any) => item.id === value) ? value : 0} onBlur={onBlur} onChange={onChange}>
            {data.map((item: any) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        )}
        name={name || "default-name"}
        control={control}
        defaultValue={defaultValue}
      />
    </FormControl>
  );
});
export default DataFormSelect;
