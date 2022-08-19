import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

import { FaPlay } from "@react-icons/all-files/fa/FaPlay";
import { FaPause } from "@react-icons/all-files/fa/FaPause";
import { useEffect, useState } from "react";
import { RingCenterdLoader } from "./Loading";

function FeedPlayBtn({ feedType = "Suggestion", item }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerState } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const [isPlayLoading, setIsPlayLoading] = useState(false);

	// spotify:user:31xkeukht47l4rnpe3xaihogxv2i:collection
	// spotify:user:31xkeukht47l4rnpe3xaihogxv2i:collection:your-episodes
	// spotify:playlist:3VD8ep5BUBIR28Mmrs3uwE
	// spotify:track:3VD8ep5BUBIR28Mmrs3uwE
	// spotify:episode:3VD8ep5BUBIR28Mmrs3uwE
	// spotify:show:3VD8ep5BUBIR28Mmrs3uwE
	// spotify:artist:5bal1WJousVM8g27E8fhmo
	const isContextType = !["track", "episode"].includes(item?.type);

	const contextId = playerState?.context?.uri.match(/\:([^:]{9,})\:?/i)?.[1];

	const isNowActive = contextId
		? item?.id === contextId && item.type === playerState.context.type
		: item?.id === playerState?.item?.id;

	const [isActive, setIsActive] = useState(isNowActive);
	useEffect(() => {
		setIsActive(isNowActive);
	}, [isNowActive]);

	const isPlaying = isActive && playerState.is_playing;
	const onPlayPause = () => {
		const getURI = () => {
			const isSpeicalType = ["collection", "yourepisodes"].includes(
				item.type
			);
			const speicalendType = {
				collection: "collection",
				yourepisodes: "collection:your-episodes",
			};
			return `spotify:${
				isSpeicalType
					? "user:" + userInfo.id + ":" + speicalendType[item.type]
					: item.type + ":" + item.id
			}`;
		};
		const query = new URLSearchParams({
			[isContextType ? "context_uri" : "uri"]: getURI(),
		}).toString();
		setIsPlayLoading(true);
		fetcher(`/api/player/${isPlaying ? "pause" : "play"}?` + query, {
			method: "PUT",
		})
			.then(() => {})
			.catch((e) => {
				console.log(e);
			})
			.finally(() => {
				setIsPlayLoading(false);
			});
	};

	return (
		<button
			onClick={onPlayPause}
			className=" flex justify-center items-center w-14 h-12 activeColor rounded-full selectedBgColor"
		>
			{!isPlayLoading ? isPlaying ? <FaPause /> : <FaPlay /> : null}{" "}
			<RingCenterdLoader isLoaded={!isPlayLoading} />
		</button>
	);
}

export default FeedPlayBtn;
