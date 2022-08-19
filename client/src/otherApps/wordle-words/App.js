import { useReducer } from "react";
import WordleKeyboard from "./components/WordleKeyboard";
import WordleWords from "./components/WordleWords";
import reducer, { initialData } from "./gameReducer";
export default function App() {
	const [data, dispatch] = useReducer(reducer, initialData);

	return (
		<div className="App flex h-screen w-full justify-center items-center flex-col gap-4">
			<WordleWords globalContext={[data, dispatch]} />
			<WordleKeyboard globalContext={[data, dispatch]} />
		</div>
	);
}
