import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import PlayListItem from "./PlayListItem";
import { useEffect, useState } from "react";
import { FaPlus } from "@react-icons/all-files/fa/FaPlus";

import { Scrollbar } from "react-scrollbars-custom";
import { RingLoader } from "./Loading";

function UserPlayLists() {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);
	const [playListItems, setPlayListItems] = useState({
		test: {
			name: "this is a long text for it",
			id: "test",
		},
	});

	const [nextLinkParmas, setNextLinkParams] = useState(null);
	const [totalPlaylist, setTotalPlaylist] = useState("");

	const [loadingPlayistDone, setLoadingPlayistDone] = useState(true);

	const onPlyalistHandler = (e) => {
		if (e.data.error) {
			alert("sorry couldn't get playlist");
			return;
		}

		const lastRes = playListItems;

		e.data.result.items.forEach((e) => {
			if (!playListItems[e.id]) lastRes[e.id] = e;
		});

		setPlayListItems(lastRes);
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
		if (!userInfo.id) return;
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
					{Object.values(playListItems).map((item) => {
						return <PlayListItem key={item.id} {...item} />;
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
