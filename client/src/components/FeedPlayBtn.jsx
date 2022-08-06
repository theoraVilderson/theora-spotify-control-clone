import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

import { FaPlay } from "@react-icons/all-files/fa/FaPlay";
import { FaPause } from "@react-icons/all-files/fa/FaPause";
import { useEffect } from "react";

function Feed({ feedType = "Suggestion" }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerState } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	useEffect(() => {}, []);

	return (
		<button className=" flex justify-center items-center w-14 h-12 activeColor rounded-full selectedBgColor">
			{playerState.is_playing ? <FaPause /> : <FaPlay />}
		</button>
	);
}

export default Feed;
