import { useEffect, useState, useMemo, useReducer } from "react";
import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";

import useFetcher from "../hooks/fetcher";

import PlayListItem from "./PlayListItem";
import { RingCenterdLoader } from "./Loading";

import { FaPlus } from "@react-icons/all-files/fa/FaPlus";

import { Scrollbar } from "react-scrollbars-custom";
import { useParams } from "react-router-dom";
import NotFound from "./NotFound";
import { helper } from "../libs/helper";

import PlaylistPopup from "./PlaylistPopup";
import { useNavigate } from "react-router-dom";

function UserPlayLists({ feedType, addToPlaylistItem, onPlaylistContext }) {
	const { playlistId } = useParams();

	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playlists, activePlayList, playerQueue } = globalData;

	const fetcher = useFetcher([globalData, dispatch]);

	const [nextPlaylistItemsLink, setNextPlaylistItemsLink] = useState(null);

	const [totalPlaylist, setTotalPlaylist] = useState("");
	const [currentTotalPlaylist, setCurrentTotalPlaylist] = useState(0);

	const [loadingPlaylist, setLoadingPlaylist] = useState(false);

	const playlistsArray = Object.values(playlists);

	const activePlayListItem = playlists?.[activePlayList];
	const navigate = useNavigate();

	const playListDataHandler = (e) => {
		if (e.data.error) {
			return;
		}

		const lastRes = playlists;

		e.data.result.items.forEach((e) => {
			if (!playlists[e.id]) lastRes[e.id] = e;
		});

		dispatch({ type: actionTypes.SET_PLAYLISTS, payload: lastRes });
		setNextPlaylistItemsLink(e.data.result.next);
		setTotalPlaylist(e.data.result.total);
		setCurrentTotalPlaylist(Object.keys(lastRes).length);
	};
	const loadMorePlayListItems = ({ forceToRestart = false } = {}) => {
		if (!userInfo?.id) return;

		if (loadingPlaylist) return;

		setLoadingPlaylist(true);

		// just get search params if exists
		const nextLink = !nextPlaylistItemsLink
			? ""
			: new URL(nextPlaylistItemsLink).search.slice(1);

		// force it means start in to just fetch first part
		let query = forceToRestart ? "limit=10" : nextLink;
		query = query ? "&" + query : "";

		const url = `/api/playlists?userId=${userInfo?.id}${query}`;

		fetcher(url)
			.then(playListDataHandler)
			.catch(console.error)
			.finally((e) => {
				setLoadingPlaylist(false);
			});
	};
	const loadNewPlayListItem = (e) => {
		if (loadingPlaylist) {
			return;
		}

		const isLoadedAllItems = totalPlaylist > playlistsArray.length;

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

		const playlistLen = Object.values(playlists).filter((e) => e).length;
		setTotalPlaylist(totalPlaylist + playlistLen - currentTotalPlaylist);
		setCurrentTotalPlaylist(playlistLen);
		// // use forceToRestart to just update the infos like totalPlayList number
		// loadMorePlayListItems({ forceToRestart: true });
	}, [playlists]);

	// clean last info
	useEffect(() => {
		if (Object.keys(playlists).length && !addToPlaylistItem) {
			dispatch({ type: actionTypes.SET_PLAYLISTS, payload: {} });
		}
	}, []);

	useEffect(() => {
		if (!userInfo?.id || Object.keys(playlists).length) return;
		// use forceToRestart to just update the infos like totalPlayList number

		loadMorePlayListItems({
			forceToRestart: true,
		});
	}, [userInfo?.id]);

	const [createPlaylistDialogOpen, setCreatePlaylistDialogOpen] =
		useState(false);

	const setNewPlaylist = (newplaylist) => {
		// update from playlist
		// update fro user playList Feed
		// update from playlist Feed

		newplaylist.isFollowed = true;
		let newData = {
			at: playlists[newplaylist.id] != null ? "end" : "start",
		};

		newData.data = { [newplaylist.id]: newplaylist };

		dispatch({
			type: actionTypes.SET_PLAYLIST,
			payload: newData,
		});
		const queue = playerQueue[feedType] ?? {};
		const feed = feedType.toLowerCase();

		if (feed === "playlist" && queue.id === newplaylist.id) {
			const playlistItems = queue.playlistItems;

			dispatch({
				type: actionTypes.SET_PLAYER_QUEUE,
				payload: {
					name: feedType,
					data: { ...newplaylist, playlistItems },
				},
			});
		} else if (
			feed === "user" &&
			queue.playlists.items[newplaylist.id] != null
		) {
			queue.playlists.items[newplaylist.id] = newplaylist;

			dispatch({
				type: actionTypes.SET_PLAYER_QUEUE,
				payload: {
					name: feedType,
					data: { ...queue, playlists: queue.playlists },
				},
			});
		}
		// navigate("/playlist/" + newplaylist.id);
	};

	const onShowClick = () => {
		setCreatePlaylistDialogOpen(totalPlaylist !== "");
	};
	return (
		<div className="sidebar__playLists mb-2 flex-1 flex flex-col justify-center ">
			{/* PlayLists */}
			<h2 className="sidebarSpace flex items-center justify-between ">
				<span className="text-xs">
					PLAYLISTS {totalPlaylist ? `(${totalPlaylist})` : null}
				</span>
				{addToPlaylistItem ? null : (
					<FaPlus
						className="activeColor cursor-pointer mr-2"
						onClick={onShowClick}
					/>
				)}
			</h2>

			{totalPlaylist !== "" && createPlaylistDialogOpen ? (
				<PlaylistPopup
					open={createPlaylistDialogOpen}
					total={totalPlaylist}
					onChange={setCreatePlaylistDialogOpen}
					onSuccess={setNewPlaylist}
				/>
			) : null}

			<Scrollbar
				style={{ height: 140 }}
				removeTrackYWhenNotUsed={+totalPlaylist <= 5}
				onUpdate={loadNewPlayListItem}
			>
				<div>
					{playlistsArray.length && playlistsArray.find((e) => e) ? (
						playlistsArray.map((item, key) => {
							// if item is deleted then use empty div
							// (for having place for undo deleting)
							if (item) {
								item.isFollowed = true;
							}
							return item ? (
								<PlayListItem
									active={item.id === activePlayList}
									key={item.id}
									{...item}
									item={item}
									userId={userInfo?.id}
									total={totalPlaylist}
									onSuccess={setNewPlaylist}
									onPlaylistContext={onPlaylistContext}
									addToPlaylistItem={addToPlaylistItem}
								/>
							) : (
								<div
									className="hidden"
									key={Object.keys(playlists)[key]}
								></div>
							);
						})
					) : (
						<NotFound
							show={!loadingPlaylist}
							className="flex justify-center items-center text-lg "
						/>
					)}
				</div>

				<RingCenterdLoader isLoaded={!loadingPlaylist} />
			</Scrollbar>
		</div>
	);
}

export default UserPlayLists;
