import { useEffect } from "react";
import { actionTypes } from "../gameReducer";

function GuestFeild({ userGuess, step, active, targetGuess, globalContext }) {
  const [
    { MAX_CHANCE, rightChars, rightCharsInBadSpot, wrongChars },
    dispatch,
  ] = globalContext;

  const splitedGuess = [...userGuess];

  return (
    <div className="flex ">
      {[...new Array(MAX_CHANCE)].map((_, key) => {
        let bgColor = "";
        if (rightCharsInBadSpot[step] != null) {
          const isBadSpot = rightCharsInBadSpot[step][key];
          const isRight = rightChars[step][key];
          const isWrong = wrongChars[step][key];
          bgColor =
            (isBadSpot
              ? "bg-yellow-500"
              : isRight
              ? "bg-green-500"
              : "bg-black") + " text-white";
        }
        return (
          <div
            className={`${bgColor}  flex justify-center items-center flex-1 border border-solid border-red-100 min-w-[30px] min-h-[30px] uppercase`}
            key={key}
          >
            {splitedGuess[key] ?? " "}
          </div>
        );
      })}
    </div>
  );
}
export default GuestFeild;
