import { useState, useEffect } from "react";
import { useGlobalContext } from "../../context/globalContext";
import { actionTypes } from "../../reducer/globalReducer";
import Loading from "../../components/Loading";
import { useSearchParams, useNavigate } from "react-router-dom";
import useFetcher from "../../hooks/fetcher";

function AfterLogin() {
	// http://localhost:3000/callback/?code=AQDBJRIxmc5CwZkr-J49Bmp_NeW4XeprPh1-Yx9f_0W6QQUdqh092yqthWPOMYdcrBN97ZP3J6weHuV3lxsOJAVAcH3mtAQyI6P9rFbLScEJuWdnZIUcEBBa3tojTXn3jUgCgtnHMPz-SYXSLo8geO7b4Ac9tdwaQk38od9EXzvFQcP20md8UnjToVBi-lfBSXNrlaGAWUceZcZu42OXF46U4BHkuqUeDY6rSoCE_ShZv_Ba79AVC9GPukxNdBuK9oyv-hYUz20aCBMP2F0J0MDsVE0cS9URJP8_xH7ZzYUUAmQhAbtQSlkUMlAIvlCD9-iXu8d1IVEh8fSCtC3SEryznn8nbBIeWpQOAhAGGn0fd7UMk9NTHD2-Ynpwa9k1Ge3Raa_C8PZdzPXVOH_sYu0_a5hht8yDoAq879TwIgvwhrpluiCZy2jE0KpKj6UJdcTl1we_eGMiZGYp2vbsCQoWDq2RIbOcis2pGsJUE5rRZpqavn2JpVACqG0Uuxhs7VLGyO8wMxbN3uXgooENyAbuXfvmvnRpFCIxhtKCXxiGE_LyhHeTl83U0Yv9eOHNnqOFizd7B9x5wq32O1ckBkUMqfZbIlIkMVtdhOekhpCJH5ksMCt3vxiAO-iQosPPvvpMTJni06Ng0RjXLgwbFQ8J0W6NmLJGU0hWV5n0kWxdmpxZhNfcnzNZ9S09P-Tn0e0xe6rc2pxnw1XTSXJmQZWU8ORM&state=276ca147-a7b5-4815-ac2c-569bea5e433d

	const [globalData, dispatch] = useGlobalContext();
	const { redirectLink, loginChallange } = globalData;
	const [isLoadingDone, setIsLoadingDone] = useState(false);
	const [getParams] = useSearchParams();
	const code = getParams.get("code");
	const userLoginChallange = getParams.get("state");
	const error = getParams.get("error");
	const urlController = useNavigate();
	const fetcher = useFetcher([globalData, dispatch]);

	useEffect(() => {
		(async () => {
			console.log({ loginChallange, userLoginChallange });
			if (loginChallange !== userLoginChallange) {
				alert("unmatched login! please try again");
				urlController("/");
				return;
			}

			if (code) {
				const tokens = await fetcher(`/api/userTokens?code=${code}`);
				console.log(tokens.data.error);
				if (tokens.data.error) {
					alert("sorry invalid login happened please try again");
					urlController("/");
					return;
				}

				dispatch({
					type: actionTypes.SET_TOKENS,
					payload: tokens.data.result,
				});
				dispatch({
					type: actionTypes.SET_LOGIN_CHALLANGE,
					payload: null,
				});
				dispatch({ type: actionTypes.SET_USERINFO, payload: null });
				dispatch({ type: actionTypes.SET_LOGIN_LINK, payload: null });
				setIsLoadingDone(true);
				return 1;
			}

			const allErrors = {
				access_denied:
					"please accept conditions and login to your account",
			};

			if (error && allErrors[error]) {
				alert(allErrors[error]);
				return urlController("/");
			}
			return urlController("/");
		})();

		// dispatch({type:actionTypes.SET_TOKENS,payload:})
	}, []);

	useEffect(() => {
		if (!isLoadingDone) return;

		setTimeout(() => {
			return urlController("/");
		}, 5000);
	}, [isLoadingDone]);
	return !isLoadingDone ? (
		<Loading />
	) : (
		<div>
			Your are logged in succssfully you will be redirected in sec ...
		</div>
	);
}

export default AfterLogin;
