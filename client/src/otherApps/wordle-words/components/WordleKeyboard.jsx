import WordleKeyboardKey from "./WordleKeyboardKey";

function WordleKeyboard({ globalContext }) {
  const keys = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["enter", "z", "x", "c", "v", "b", "n", "m", "l", "backspace"],
  ];
  return (
    <div className="flex flex-col min-w-[210px]">
      {keys.map((row, rowKey) => {
        return (
          <div key={rowKey} className="flex">
            {row.map((e, subkey) => {
              return (
                <WordleKeyboardKey
                  globalContext={globalContext}
                  key={rowKey + subkey}
                  keyValue={e}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
export default WordleKeyboard;
