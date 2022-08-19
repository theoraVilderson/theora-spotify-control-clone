import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import GlobalContextProvider from "./context/globalContext";
import reducer, { initialValue } from "./reducer/globalReducer";

// import WordleApp from "./otherApps/wordle-words/App.js";
const root = ReactDOM.createRoot(document.getElementById("root"));

// const OtherApp = WordleApp;

// root.render(<OtherApp />);
root.render(
	<GlobalContextProvider initialValue={initialValue} reducer={reducer}>
		<App />
	</GlobalContextProvider>
);
