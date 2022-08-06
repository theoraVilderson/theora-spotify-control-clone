import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

import { useEffect, useState, useMemo } from "react";

import { BsThreeDots } from "@react-icons/all-files/bs/BsThreeDots";
import { RiUserFollowLine } from "@react-icons/all-files/ri/RiUserFollowLine";
import { GoCheck } from "@react-icons/all-files/go/GoCheck";
import { RingLoader } from "./Loading";
import SongItem from "./SongItem";
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
	const [isProcessFollow, setIsProcessFollow] = useState(false);
	const [playlist, setPlayList] = useState({});
	const { playlistInfo = {}, playlistItems = {} } = playlist;
	const [isFollowed, setIsFollowed] = useState(false);
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
				setIsFollowed(res?.playlistInfo?.isFollowed);
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
	const onHitFollow = () => {
		if (isProcessFollow || !playlistInfo?.name) return 1;
		setIsProcessFollow(true);

		fetcher(`/api/playlist/follow/${playlistId}`, {
			method: !isFollowed ? "PUT" : "DELETE",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				setIsFollowed(!isFollowed);

				const update = !!playlists[playlistId];
				let newData = playlists;
				if (playlists[playlistId] != null && isFollowed === true) {
					newData = { ...newData, [playlistId]: "" };
				} else if (isFollowed === false) {
					if (playlists[playlistId] != null) {
						newData = { ...newData, [playlistId]: playlistInfo };
					} else {
						newData = { [playlistId]: playlistInfo, ...newData };
					}
				}

				dispatch({
					type: actionTypes.SET_PLAYLISTS,
					payload: newData,
				});
			})
			.catch((e) => {
				console.log(e);
				alert(
					`sorry couldn't ${
						isFollowed ? "unSave" : "Save"
					} the playlist`
				);
			})
			.finally(() => {
				setIsProcessFollow(false);
			});
	};

	return (
		<div className="playlist min-h-screen">
			<div
				className="playlist__top h-[40vh] min-h-[340px] bg-no-repeat "
				style={
					backgroundImg && {
						backgroundImage: `url(${backgroundImg})`,
						backgroundAttachment: "fixed",
						backgroundPosition: "50% 50%",
						backgroundSize: "cover",
						contain: "strict",
						contentVisibility: "auto",
					}
				}
			>
				<div className="w-full h-full bg-[rgba(0,0,0,0.5)] p-4 flex flex-col justify-between">
					<div className="flex justify-between">
						<div className="breadCrump">
							Home /{" "}
							<span className="activeColor">{feedType}</span>
						</div>
						<BsThreeDots className="activeColorHover cursor-pointer" />
					</div>
					<div className="flex lg:justify-between gap-2 lg:items-center flex-col lg:flex-row">
						<div className="flex flex-col gap-2">
							<h1
								title={playlistInfo?.name}
								className="md:text-5xl text-lg font-bold activeColor max-w-[350px] md:truncate min-h-[4rem]"
							>
								<Link
									to={`/playlist/${playlistId}`}
									className="border-b break-all hover:border-current border-solid border-transparent font-bold activeColor"
								>
									{playlistInfo?.name}
								</Link>
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
										<Link
											to={`/${playlistInfo?.owner.type}/${playlistInfo?.owner.id}`}
											className="border-b break-all hover:border-current border-solid border-transparent font-bold activeColor"
										>
											{playlistInfo?.owner?.display_name}
										</Link>
									</>
								) : null}
							</div>
						</div>
						<div className="flex gap-5 self-end lg:self-auto">
							<button
								className=" w-20 h-12 activeColor rounded-full"
								style={{
									backgroundColor:
										"var(--text-bright-accent)",
								}}
								onClick={() => {
									document
										.querySelector(".player_playing")
										?.click?.();
								}}
							>
								Play
							</button>
							<button
								onClick={onHitFollow}
								className="bg-transparent  w-32 h-12 rounded-full border-2 border-current border-solid flex justify-center items-center gap-2"
							>
								{isProcessFollow ? (
									<RingLoader
										className=""
										color={window
											.getComputedStyle(
												document.documentElement
											)
											.getPropertyValue("--text-base")}
										width="20px"
										height="20px"
									/>
								) : (
									<>
										{isFollowed ? (
											<IoMdHeart />
										) : (
											<FaRegHeart />
										)}
										{!isFollowed ? "Save" : "Saved"}
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
			<div className="playlist__songs flex flex-col">
				{playlistItems?.items?.map?.((e, k) => {
					e = e.track;
					return (
						<SongItem key={e.id} numberId={k + 1} songInfo={e} />
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
