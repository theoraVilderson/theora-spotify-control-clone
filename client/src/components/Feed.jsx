import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import Header from "./Header";
import Player from "./Player";

function Feed() {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

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
	return (
		<main className="flex justify-around h-screen">
			<Header />
			<Player />
		</main>
	);
}

export default Feed;
