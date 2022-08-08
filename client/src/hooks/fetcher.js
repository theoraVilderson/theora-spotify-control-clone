import { actionTypes } from "../reducer/globalReducer";

export default function useFetcher([, dispatch] = []) {
	let tries = 3;

	return async function fetcher(...args) {
		const logout = async () => {
			let res;
			try {
				res = await fetcher("/api/logout");
			} catch (e) {
				return 0;
			}
			if (res.data.error) return 1;

			dispatch({ type: actionTypes.LOG_OUT_USER });
		};
		return fetch(...args)
			.then((e) => e.json())
			.then(async (e) => {
				if (
					["TOKEN_IS_NOT_VALID", "INVALID_TOKEN"].includes(
						e.data.error
					)
				) {
					tries--;
					if (tries <= 0) {
						tries = 3;
						return null;
					}
					let res;
					try {
						res = await fetcher("/api/updateTokens");
					} catch (e) {
						console.log(e);

						return await fetcher(...args);
					}
					res &&
						dispatch({
							type: actionTypes.SET_TOKENS,
							payload: res,
						});
					return await fetcher(...args);
				} else if (
					["RELOGIN_USER", "COULD_NOT_REFRESH_USER_TOKEN"].includes(
						e.data.error
					)
				) {
					await logout();
					// null means go to login!
					return null;
				} else if (e.data.error) {
					console.error("Error: " + e.data.error);
				}

				return e;
			});
	};
}
