import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import Header from "./Header";
import Player from "./Player";
import Suggestion from "./Suggestion";
import PlayList from "./PlayList";
import Album from "./Album";
import Track from "./Track";
import Artist from "./Artist";
import SidebarRight from "./SidebarRight";
import User from "./User";
import Show from "./Show";
import Episode from "./Episode";

function Feed({ feedType = "Suggestion" }) {
	const FeedTypes = {
		Suggestion: Suggestion,
		Playlist: PlayList,
		Album: Album,
		Track: Track,
		Artist: Artist,
		User: User,
		Show: Show,
		Episode: Episode,
	};

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
	const TheFeed = FeedTypes[feedType] ?? FeedTypes.Suggestion;

	return (
		<main className="flex justify-around h-full w-full sticky top-0">
			{/*<Header  />*/}
			<section className="flex-1">
				<div className="min-h-screen">
					<TheFeed feedType={feedType} />
				</div>
				<Player feedType={feedType} />
			</section>
			<SidebarRight feedType={feedType} />
		</main>
	);
}

export default Feed;
