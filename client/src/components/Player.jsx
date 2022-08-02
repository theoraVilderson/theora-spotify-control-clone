import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

function Player() {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, tokens } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	return <div className="flex justify-around">Player</div>;
}

export default Player;
