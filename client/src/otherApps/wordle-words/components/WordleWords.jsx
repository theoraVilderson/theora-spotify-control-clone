import { useEffect, useState } from "react";
import { actionTypes } from "../gameReducer";
import axios from "axios";
import GuestFeild from "./GuestFeild";

export const submitWord = (geussWord, wordToGuess) => {
  geussWord = geussWord.toUpperCase();
  wordToGuess = wordToGuess.toUpperCase();
  const splitedGuess = [...(geussWord ?? "")];
  const lastRes = {
    status: "WIN",
    data: {
      rightCharsInBadSpot: [],
      rightChars: [],
      wrongChars: [],
    },
  };

  if (geussWord.toLowerCase() === wordToGuess.toLowerCase()) return lastRes;

  if (splitedGuess.length !== wordToGuess.length)
    return { ...lastRes, status: "NOT_ENOUGH_LETTERS" };

  lastRes.data.rightChars = [...wordToGuess].map((e, k) =>
    e === splitedGuess[k] ? e : ""
  );
  lastRes.data.wrongChars = splitedGuess.filter(
    (e, k) => !wordToGuess.includes(e)
  );

  lastRes.data.rightCharsInBadSpot = [...splitedGuess].map((e, key) => {
    const thereisOne = lastRes.data.rightChars[key];
    if (thereisOne) {
      return "";
    }
    const sp = [...wordToGuess];
    lastRes.data.rightChars.forEach((b, bkey) => {
      if (e === b) {
        sp.splice(bkey, 1);
      }
    });
    return sp.join("").includes(e) ? e : "";
  });

  if (!Object.values(lastRes.data).flat(2).length)
    return { ...lastRes, status: "NO_VALID" };

  return { ...lastRes, status: "NEXT" };

  // check or do something
};
function WordleWords({ globalContext }) {
  const [
    { wordToGuess, MAX_CHANCE, userWordGuessed, currentGuess, currentStep },
    dispatch,
  ] = globalContext;

  const [isLoadingWord, setIsLoadingWord] = useState(false);
  useEffect(() => {
    if (wordToGuess) return;
    // use extentoin for cors error!
    const API_URL = `https://api.frontendexpert.io/api/fe/wordle-words`;

    async function fetchData() {
      setIsLoadingWord(true);
      let words;
      try {
        const res = await fetch(API_URL);
        words = await res.json();
      } catch (e) {
        return e;
      } finally {
        setIsLoadingWord(false);
      }

      const randWord = words[~~(Math.random() * words.length)];

      dispatch({
        type: actionTypes.SET_TARGET_GUESS,
        payload: randWord,
      });
    }
    fetchData();
  }, [wordToGuess]);

  const rest = () => {
    dispatch({ type: actionTypes.CLEAR_DATA });
  };
  const onLoose = () => {
    alert("you lose right answer is : " + wordToGuess);
    rest();
  };
  const onWin = () => {
    alert("you have guest it correctly : " + wordToGuess);
    rest();
  };
  const onHitKey = (e) => {
    console.log("on hitting", e);
    const { key } = e;
    if (key.toLowerCase().includes("enter")) {
      const { data, status } = submitWord(currentGuess, wordToGuess);
      console.log({ data, status });
      if (status === "NO_VALID") {
        alert("the Word fully invalid");
      } else if (status === "NEXT") {
        if (MAX_CHANCE === currentStep + 1) return onLoose();
        dispatch({
          type: actionTypes.ADD_RIGHT_CHAR_WRONG_SPOT,
          payload: data.rightCharsInBadSpot,
        });
        dispatch({
          type: actionTypes.ADD_RIGHT_CHAR,
          payload: data.rightChars,
        });
        dispatch({
          type: actionTypes.ADD_WRONG_CHAR,
          payload: data.wrongChars,
        });
        dispatch({
          type: actionTypes.ADD_TO_USER_GUESS_LIST,
          payload: currentGuess,
        });
        dispatch({
          type: actionTypes.SET_CURRENT_STEP,
          payload: currentStep + 1,
        });
        dispatch({
          type: actionTypes.SET_CURRENT_GUESS,
          payload: "",
        });
      } else if (status === "NOT_ENOUGH_LETTERS") {
        alert("Not enough letters");
      } else {
        onWin();
      }
      return 1;
    }
    if (key.toLowerCase().includes("backspace")) {
      dispatch({
        type: actionTypes.SET_CURRENT_GUESS,
        payload: currentGuess.slice(0, currentGuess.length - 1),
      });
      return 1;
    }
    const isKeyValue = key.length === 1;
    const isChar = key.match(/^[a-z]{1}$/i);

    if (!isChar || !isKeyValue || currentGuess.length === wordToGuess.length)
      return 1;

    dispatch({
      type: actionTypes.SET_CURRENT_GUESS,
      payload: currentGuess + key,
    });
  };
  useEffect(() => {
    window.addEventListener("keydown", onHitKey);

    return () => {
      window.removeEventListener("keydown", onHitKey);
    };
  }, [JSON.stringify(globalContext)]);
  console.log(globalContext[0]);
  return (
    <div className="flex flex-col  ">
      {wordToGuess && !isLoadingWord
        ? [...new Array(MAX_CHANCE)].map((_, key) => {
            return (
              <GuestFeild
                key={key}
                targetGuess={wordToGuess}
                active={currentStep === key}
                step={key}
                userGuess={
                  currentStep === key
                    ? currentGuess
                    : userWordGuessed[key] ?? ""
                }
                globalContext={globalContext}
              />
            );
          })
        : "loading"}
    </div>
  );
}
export default WordleWords;
