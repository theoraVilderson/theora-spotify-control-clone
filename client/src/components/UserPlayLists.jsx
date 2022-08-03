import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import PlayListItem from "./PlayListItem";
import { useEffect, useState } from "react";
import { FaPlus } from "@react-icons/all-files/fa/FaPlus";

import { Scrollbar } from "react-scrollbars-custom";
import { RingLoader } from "./Loading";
import { useParams } from "react-router-dom";

function UserPlayLists() {
	const { playlistId } = useParams();

	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playlists, activePlayList } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const [nextLinkParmas, setNextLinkParams] = useState(null);
	const [totalPlaylist, setTotalPlaylist] = useState("");

	const [loadingPlayistDone, setLoadingPlayistDone] = useState(true);

	const onPlyalistHandler = (e) => {
		if (e.data.error) {
			alert("sorry couldn't get playlist");
			return;
		}

		const lastRes = playlists;

		e.data.result.items.forEach((e) => {
			if (!playlists[e.id]) lastRes[e.id] = e;
		});

		dispatch({ type: actionTypes.SET_PLAYISTS, payload: lastRes });
		let nextLink = e.data.result.next;
		nextLink = !nextLink ? null : new URL(nextLink).search.slice(1);
		setNextLinkParams(nextLink);
		setTotalPlaylist(e.data.result.total);
	};
	const onLoadMore = () => {
		if (!nextLinkParmas) return 1;

		setLoadingPlayistDone(false);

		if (!userInfo.id) return;
		fetcher(`/api/playlists?userId=${userInfo.id}${"&" + nextLinkParmas}`)
			.then(onPlyalistHandler)
			.catch((e) => {
				console.error(e);
				alert("sorry couldn't get playlist");
			})
			.finally((e) => {
				setLoadingPlayistDone(true);
			});
	};
	const onNewLoad = (e) => {
		if (!loadingPlayistDone) {
			return;
		}
		if (e.clientHeight + e.scrollTop >= e.scrollHeight) {
			onLoadMore();
		}
	};

	useEffect(() => {
		dispatch({ type: actionTypes.SET_ACTIVE_PLAYIST, payload: playlistId });
	}, [playlistId]);

	useEffect(() => {
		if (!userInfo?.id) return;
		fetcher(`/api/playlists?userId=${userInfo.id}&limit=10`)
			.then(onPlyalistHandler)
			.catch((e) => {
				console.error(e);
				alert("sorry couldn't get playlist");
			});
	}, [userInfo]);

	return (
		<div className="sidebar__playLists mb-2 flex-1 flex flex-col justify-center ">
			{/* PlayLists */}
			<h2 className="sidebarSpace flex items-center justify-between ">
				<span className="text-xs">
					PLAYLISTS {totalPlaylist ? `(${totalPlaylist})` : null}
				</span>
				<FaPlus className="activeColor cursor-pointer" />
			</h2>

			<Scrollbar
				style={{
					height: 140,
				}}
				removeTrackYWhenNotUsed={+totalPlaylist <= 5}
				onUpdate={onNewLoad}
			>
				<div>
					{Object.values(playlists).map((item) => {
						return (
							<PlayListItem
								active={item.id === activePlayList}
								key={item.id}
								{...item}
							/>
						);
					})}
				</div>
				{!loadingPlayistDone && (
					<div className="flex justify-center items-center">
						<RingLoader />
					</div>
				)}
			</Scrollbar>
		</div>
	);
}

export default UserPlayLists;
