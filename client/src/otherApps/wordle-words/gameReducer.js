export const initialData = {
  wordToGuess: null,
  rightCharsInBadSpot: [],
  rightChars: [],
  wrongChars: [],
  userWordGuessed: [],
  currentGuess: "",
  MAX_CHANCE: 5,
  currentStep: 0,
};

export const actionTypes = {
  SET_CURRENT_GUESS: "SET_CURRENT_GUESS",
  SET_TARGET_GUESS: "SET_TARGET_GUESS",
  ADD_TO_USER_GUESS_LIST: "ADD_TO_USER_GUESS_LIST",
  ADD_RIGHT_CHAR_WRONG_SPOT: "ADD_RIGHT_CHAR_WRONG_SPOT",
  ADD_RIGHT_CHAR: "ADD_RIGHT_CHAR",
  ADD_WRONG_CHAR: "ADD_WRONG_CHAR",
  CURRENT_STEP: "CURRENT_STEP",
  CLEAR_DATA: "CLEAR_DATA",
};

function reducer(state, { type, payload }) {
  const {
    SET_CURRENT_GUESS,
    SET_TARGET_GUESS,
    ADD_TO_USER_GUESS_LIST,
    ADD_RIGHT_CHAR_WRONG_SPOT,
    ADD_RIGHT_CHAR,
    SET_CURRENT_STEP,
    ADD_WRONG_CHAR,
    CLEAR_DATA,
  } = actionTypes;

  const res = (newData) => {
    return { ...state, ...newData };
  };

  switch (type) {
    case SET_CURRENT_GUESS:
      return res({ currentGuess: payload });
    case SET_CURRENT_STEP:
      return res({ currentStep: payload });
    case SET_TARGET_GUESS:
      return res({ wordToGuess: payload });
    case ADD_TO_USER_GUESS_LIST:
      return res({ userWordGuessed: [...state.userWordGuessed, payload] });
    case ADD_RIGHT_CHAR_WRONG_SPOT:
      return res({
        rightCharsInBadSpot: [...state.rightCharsInBadSpot, payload],
      });
    case ADD_RIGHT_CHAR:
      return res({ rightChars: [...state.rightChars, payload] });
    case ADD_WRONG_CHAR:
      return res({ wrongChars: [...state.rightChars, payload] });
    case CLEAR_DATA:
      return res(initialData);
    default:
      return state;
  }
}
export default reducer;
