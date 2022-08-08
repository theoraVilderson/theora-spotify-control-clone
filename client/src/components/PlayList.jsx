import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

import { useEffect, useState, useMemo } from "react";

import { BsThreeDots } from "@react-icons/all-files/bs/BsThreeDots";
import { RiUserFollowLine } from "@react-icons/all-files/ri/RiUserFollowLine";
import { GoCheck } from "@react-icons/all-files/go/GoCheck";
import { RingLoader } from "./Loading";
import SongItem from "./SongItem";
import Follow from "./Follow";
import FeedHead from "./FeedHead";
import LinkWithBorder from "./LinkWithBorder";
import { FaRegHeart } from "@react-icons/all-files/fa/FaRegHeart";
import { IoMdHeart } from "@react-icons/all-files/io/IoMdHeart";
import { useParams, Link } from "react-router-dom";

function PlayList({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const {
		userInfo,
		playerQueue: allPlayerQueue,
		activeMusic,
		playlists,
	} = globalData;
	const fetcher = useFetcher([globalData, dispatch]);
	const playerQueue = allPlayerQueue[feedType] ?? {};
	const activeMusicId = activeMusic?.id;

	const { playlistId } = useParams();

	const [nextLink, setNextLink] = useState(null);
	const [playlist, setPlayList] = useState({});
	const { playlistInfo = {}, playlistItems = {} } = playlist;
	const [updateCount, setUpdateCount] = useState(0);
	const [loadingPlaylistDone, setLoadingPlaylistDone] = useState(false);
	const loadPlayListInfo = ({ replace = false } = {}) => {
		const theNextLink = !nextLink
			? null
			: new URL(nextLink).search.slice(1);
		setLoadingPlaylistDone(false);

		fetcher(
			`/api/playlistFullInfo/${playlistId}${
				theNextLink ? "?" + theNextLink : ""
			}`
		)
			.then((e) => {
				if (e.data.error) {
					return;
				}
				console.log(e.data.result);

				const res = e.data.result;

				if (Object.keys(playlistItems).length && !replace) {
					const newData = [
						...playlistItems.items,
						...res.playlistItems.items,
					].reduce((e, k) => {
						e[k.track.id] = k;

						return e;
					}, {});

					res.playlistItems.items = Object.values(newData);
				}

				setPlayList(res);
				setNextLink(res.playlistItems.next);

				const filterTrack = res.playlistItems.items.reduce((e, k) => {
					e[k.track.id] = k.track;

					return e;
				}, {});

				dispatch({
					type: actionTypes.SET_PLAYER_QUEUE,
					payload: {
						name: feedType,
						data: filterTrack,
					},
				});
			})
			.catch((e) => {
				console.log(e);
				// alert("sorry couldn't get playlistItems");
			})
			.finally(() => {
				setLoadingPlaylistDone(true);
			});
	};

	useEffect(() => {
		loadPlayListInfo();
	}, [updateCount]);
	useEffect(() => {
		loadPlayListInfo({ replace: true });
	}, [playlistId]);
	const onLoadMore = () => {
		if (nextLink) return;

		loadPlayListInfo();
	};

	useEffect(() => {
		const action = (e) => {
			const html = document.documentElement;
			if (
				html.clientHeight + html.scrollTop >= html.scrollHeight &&
				(playlistItems?.total == null ||
					playlistItems?.total > playlistItems?.items?.length)
			) {
				setUpdateCount((e) => e + 1);
			}
		};

		window.addEventListener("scroll", action);

		return () => {
			window.removeEventListener("scroll", action);
		};
	}, [playlistItems]);

	const backgroundImg = playlistInfo?.images?.[0]?.url;

	return (
		<div className="playlist min-h-screen">
			<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
				<div className="flex flex-col gap-2">
					<h1
						title={playlistInfo?.name}
						className="md:text-5xl text-lg font-bold activeColor  min-h-[4rem]"
					>
						<LinkWithBorder to={`/playlist/${playlistInfo?.id}`}>
							{playlistInfo?.name}
						</LinkWithBorder>
					</h1>

					<div className="flex gap-2 items-center">
						<RiUserFollowLine className="activeColor" />
						<span className="activeColor">
							{playlistInfo?.followers?.total?.toLocaleString()}
						</span>
						Fallowers{" "}
						{playlistInfo?.owner?.display_name ? (
							<>
								By Owner{" "}
								<LinkWithBorder
									to={`/${playlistInfo?.owner.type}/${playlistInfo?.owner.id}`}
								>
									{playlistInfo?.owner?.display_name}
								</LinkWithBorder>
							</>
						) : null}
					</div>
				</div>

				<div className="flex items-center justify-center gap-5 self-end lg:self-auto  w-full lg:justify-end">
					<button
						className=" w-20 h-12 activeColor rounded-full"
						style={{
							backgroundColor: "var(--text-bright-accent)",
						}}
						onClick={() => {
							document
								.querySelector(".player_playing")
								?.click?.();
						}}
					>
						Play
					</button>

					<Follow
						target={playlistInfo}
						FollowContent={
							<>
								<FaRegHeart />
								Save
							</>
						}
						UnFollowContent={
							<>
								<IoMdHeart /> Saved
							</>
						}
					/>
				</div>
			</FeedHead>
			<div className="playlist__songs flex flex-col">
				{playlistItems?.items?.map?.((e, k) => {
					e = e.track;
					return (
						<SongItem
							key={e.id}
							numberId={k + 1}
							songInfo={e}
							feedType={feedType}
						/>
					);
				})}
			</div>
			{!loadingPlaylistDone && (
				<div className="flex justify-center items-center">
					<RingLoader />
				</div>
			)}
		</div>
	);
}

export default PlayList;
