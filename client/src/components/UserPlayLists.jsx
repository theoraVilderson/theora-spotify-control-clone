import { useEffect, useState, useMemo } from "react";

import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";

import useFetcher from "../hooks/fetcher";

import PlayListItem from "./PlayListItem";
import { RingCenterdLoader } from "./Loading";

import { FaPlus } from "@react-icons/all-files/fa/FaPlus";

import { Scrollbar } from "react-scrollbars-custom";
import { useParams } from "react-router-dom";

function UserPlayLists() {
	const { playlistId } = useParams();

	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playlists, activePlayList } = globalData;

	const fetcher = useFetcher([globalData, dispatch]);

	const [nextPlaylistItemsLink, setNextPlaylistItemsLink] = useState(null);

	const [totalPlaylist, setTotalPlaylist] = useState("");

	const [loadingPlaylistDone, setLoadingPlaylistDone] = useState(true);

	const playlistsArray = Object.values(playlists);

	const activePlayListItem = playlists?.[activePlayList];

	const playListDataHandler = (e) => {
		if (e.data.error) {
			console.error("sorry couldn't get playlist");
			return;
		}

		const lastRes = playlists;

		e.data.result.items.forEach((e) => {
			if (!playlists[e.id]) lastRes[e.id] = e;
		});

		dispatch({ type: actionTypes.SET_PLAYLISTS, payload: lastRes });
		setNextPlaylistItemsLink(e.data.result.next);
		setTotalPlaylist(e.data.result.total);
	};
	const loadMorePlayListItems = ({ forceToRestart = false } = {}) => {
		if (!userInfo?.id) return;

		if (!loadingPlaylistDone) return;

		setLoadingPlaylistDone(false);

		// just get search params if exists
		const nextLink = !nextPlaylistItemsLink
			? ""
			: new URL(nextPlaylistItemsLink).search.slice(1);

		// force it means start in to just fetch first part
		let query = forceToRestart ? "limit=10" : nextLink;
		query = query ? "&" + query : "";

		const url = `/api/playlists?userId=${userInfo.id}${query}`;

		fetcher(url)
			.then(playListDataHandler)
			.catch(console.error)
			.finally((e) => {
				setLoadingPlaylistDone(true);
			});
	};
	const loadNewPlayListItem = (e) => {
		if (!loadingPlaylistDone) {
			return;
		}

		const isLoadedAllItems =
			totalPlaylist === "" || totalPlaylist > playlistsArray.length;

		const isRechedToEndOfScroll =
			e.clientHeight + e.scrollTop >= e.scrollHeight;

		// load more if reached to end of scroll and if is there new items

		if (!(isRechedToEndOfScroll && isLoadedAllItems)) return;

		loadMorePlayListItems();
	};

	useEffect(() => {
		dispatch({ type: actionTypes.SET_ACTIVE_PLAYIST, payload: playlistId });
	}, [playlistId]);

	useEffect(() => {
		if (!userInfo?.id) return;
		// use forceToRestart to just update the infos like totalPlayList number
		loadMorePlayListItems({ forceToRestart: true });
	}, [userInfo, playlists]);

	return (
		<div className="sidebar__playLists mb-2 flex-1 flex flex-col justify-center ">
			{/* PlayLists */}
			<h2 className="sidebarSpace flex items-center justify-between ">
				<span className="text-xs">
					PLAYLISTS {totalPlaylist ? `(${totalPlaylist})` : null}
				</span>
				<FaPlus className="activeColor cursor-pointer mr-2" />
			</h2>

			<Scrollbar
				style={{ height: 140 }}
				removeTrackYWhenNotUsed={+totalPlaylist <= 5}
				onUpdate={loadNewPlayListItem}
			>
				<div>
					{playlistsArray.map((item, key) => {
						// if item is deleted then use empty div
						// (for having place for undo deleting)
						return item ? (
							<PlayListItem
								active={item.id === activePlayList}
								key={item.id}
								{...item}
							/>
						) : (
							<div
								className="hidden"
								key={Object.keys(playlists)[key]}
							></div>
						);
					})}
				</div>

				<RingCenterdLoader isLoaded={loadingPlaylistDone} />
			</Scrollbar>
		</div>
	);
}

export default UserPlayLists;
