import { useEffect } from "react";
import { actionTypes } from "../gameReducer";

import { submitWord } from "./WordleWords";

function GuestFeild({ keyValue, globalContext }) {
  const [
    { MAX_CHANCE, rightChars, rightCharsInBadSpot, wrongChars },
    dispatch,
  ] = globalContext;

  const isRight = rightChars.flat(2).includes(keyValue.toUpperCase());
  const isWrong = wrongChars.flat(2).includes(keyValue.toUpperCase());
  const isWrongSpot = rightCharsInBadSpot
    .flat(2)
    .includes(keyValue.toUpperCase());

  const bgColor = isRight
    ? "bg-green-500"
    : isWrong
    ? "bg-black "
    : isWrongSpot
    ? "bg-yellow-500"
    : "";
  return (
    <div
      className={`flex ${
        bgColor ? bgColor + " text-white" : ""
      } flex-1 border-solid border-red-100 border justify-center items-center p-2 cursor-pointer hover:bg-red-300 uppercase`}
      onClick={() => {
        // submitWord({ e: { key: keyValue } });
        window.dispatchEvent(new KeyboardEvent("keydown", { key: keyValue }));
      }}
    >
      {keyValue}
    </div>
  );
}
export default GuestFeild;
