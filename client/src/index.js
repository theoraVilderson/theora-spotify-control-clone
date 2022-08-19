import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import GlobalContextProvider from "./context/globalContext";
import reducer, { initialValue } from "./reducer/globalReducer";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
	<GlobalContextProvider initialValue={initialValue} reducer={reducer}>
		<App />
	</GlobalContextProvider>
);
