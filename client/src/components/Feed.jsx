import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import Header from "./Header";
import Player from "./Player";
import Suggestion from "./Suggestion";
import PlayList from "./PlayList";
import Album from "./Album";
import Track from "./Track";
import ArtistRouter from "./ArtistRouter";
import SidebarRight from "./SidebarRight";
import User from "./User";
import Show from "./Show";
import Episode from "./Episode";
import LikedSongs from "./LikedSongs";
import LikedArtists from "./LikedArtists";
import LikedAlbums from "./LikedAlbums";
import LikedPodcasts from "./LikedPodcasts";
import Search from "./Search";

function Feed({ feedType = "Suggestion" }) {
	const FeedTypes = {
		Suggestion: Suggestion,
		Playlist: PlayList,
		Album: Album,
		Track: Track,
		Artist: ArtistRouter,
		User: User,
		Show: Show,
		Episode: Episode,
		LikedSongs: LikedSongs,
		LikedArtists: LikedArtists,
		LikedAlbums: LikedAlbums,
		LikedPodcasts: LikedPodcasts,
		Search: Search,
	};

	const [globalData, dispatch] = useGlobalContext();
	const { userInfo } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

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
