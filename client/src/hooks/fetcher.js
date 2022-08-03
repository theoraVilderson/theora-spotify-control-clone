import { actionTypes } from "../reducer/globalReducer";
export default function useFetcher([, dispatch] = []) {
	return async function fetcher(...args) {
		return fetch(...args)
			.then((e) => e.json())
			.then(async (e) => {
				if (e.data.error === "TOKEN_IS_NOT_VALID") {
					let res;
					try {
						res = await fetcher("/api/updateTokens");
					} catch (e) {
						return await fetcher(...args);
					}

					dispatch({ type: actionTypes.SET_TOKENS, payload: res });
					return await fetcher(...args);
				} else if (e.data.error == "RELOGIN_USER") {
					dispatch({ type: actionTypes.LOG_OUT_USER });
					// null means go to login!
					return null;
				} else if (e.data.error) {
					alert("Error: " + e.data.error);
				}

				return e;
			});
	};
}
