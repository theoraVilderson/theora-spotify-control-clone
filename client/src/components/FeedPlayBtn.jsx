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

	// spotify:user:31xkeukht47l4rnpe3xaihogxv2i:collection
	// spotify:user:31xkeukht47l4rnpe3xaihogxv2i:collection:your-episodes
	// spotify:playlist:3VD8ep5BUBIR28Mmrs3uwE
	// spotify:track:3VD8ep5BUBIR28Mmrs3uwE
	// spotify:episode:3VD8ep5BUBIR28Mmrs3uwE
	// spotify:show:3VD8ep5BUBIR28Mmrs3uwE
	// spotify:artist:5bal1WJousVM8g27E8fhmo
	useEffect(() => {}, []);

	return (
		<button className=" flex justify-center items-center w-14 h-12 activeColor rounded-full selectedBgColor">
			{playerState.is_playing ? <FaPause /> : <FaPlay />}
		</button>
	);
}

export default Feed;
