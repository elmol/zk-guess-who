import { Card, CardContent, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { forwardRef } from "react";
import { Controller } from "react-hook-form";
import data from "../public/characters.json";

type FromProps = React.HTMLProps<HTMLFormElement> & { control: typeof Controller | undefined } & { characters: number };
// eslint-disable-next-line react/display-name
const CharacterSelector = forwardRef<any, any>(({ name, label, control, defaultValue, characters, ...props }, ref) => {
  const board = data.characters;
  const labelId = `${name}-label`;

  function mapCharacter(character: number[]) {
    return character.map((n: number) => n.toString()).join("-");
  }

  function getNameByChars(chars: number[]) {
    const characterName = board.find((character: any) => mapCharacter(chars) === character.characteristics)?.name;
    if (!characterName) {
      return mapCharacter(chars);
    }
    return characterName;
  }

  function getCharsOptions(typeId: number) {
    const filtered = data.questions
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

  function getCharName(typeId: number, id: number) {
    return getCharsOptions(typeId).find((char) => char.id === id)?.name;
  }

  function getDescription(character: string) {
    const guess = character.split("-").map((n: string) => parseInt(n.trim()));
    const color = getCharName(0, guess[0]); //"red";
    const animal = getCharName(1, guess[1]); // "cat";
    const accessory = getCharName(2, guess[2]); //"a bandana";
    const spots = getCharName(3, guess[3]); //"triangle spots";
    const withSpots = spots ? ` covered with ${spots} spots` : "";
    const withAccessory = accessory ? ` wearing ${accessory}` : "";  
    const withSpotsAndAccessory = withSpots && withAccessory ? `${withSpots} and ${withAccessory}` : withSpots || withAccessory;
    return `It's a ${color} ${animal}${withSpotsAndAccessory}.`;
  }

  return (
    <FormControl {...props}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Controller
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <>
            <Select labelId={labelId} label={label} value={value} onBlur={onBlur} onChange={onChange}>
              {characters?.map((character: number[]) => (
                <MenuItem key={mapCharacter(character)} value={mapCharacter(character)}>
                  {getNameByChars(character)}
                </MenuItem>
              ))}
            </Select>
            <Card sx={{ mt: 1, background: '#cbf9f2'}} raised={true}>
              <CardContent>
                <Typography variant="body1">{getDescription(value)}</Typography>
              </CardContent>
            </Card>
          </>
        )}
        name={name || "default-name"}
        control={control}
        defaultValue={defaultValue}
      />
    </FormControl>
  );
});
export default CharacterSelector;
