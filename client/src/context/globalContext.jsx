import { useContext, createContext, useReducer } from "react";

const Context = createContext();

const GlobalContextProvider = ({ reducer, initialValue, children }) => {
	return (
		<Context.Provider value={useReducer(reducer, initialValue)}>
			{children}
		</Context.Provider>
	);
};

export const useGlobalContext = () => useContext(Context);
export default GlobalContextProvider;
