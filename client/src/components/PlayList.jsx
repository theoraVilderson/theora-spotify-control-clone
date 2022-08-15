import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

import { useEffect, useState, useMemo } from "react";

import { BsThreeDots } from "@react-icons/all-files/bs/BsThreeDots";
import { RiUserFollowLine } from "@react-icons/all-files/ri/RiUserFollowLine";
import { GoCheck } from "@react-icons/all-files/go/GoCheck";
import { RingCenterdLoader } from "./Loading";
import SongItem from "./SongItem";
import Follow from "./Follow";
import FeedHead from "./FeedHead";
import LinkWithBorder from "./LinkWithBorder";
import { FaRegHeart } from "@react-icons/all-files/fa/FaRegHeart";
import { IoMdHeart } from "@react-icons/all-files/io/IoMdHeart";
import { useParams, Link } from "react-router-dom";
import NotFound from "./NotFound";
import { helper } from "../libs/helper";

function PlayList({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const {
		userInfo,
		playerQueue: allPlayerQueue,
		activeMusic,
		playlists,
	} = globalData;
	const fetcher = useFetcher([globalData, dispatch]);
	const playlist = allPlayerQueue[feedType] ?? {};
	const activeMusicId = activeMusic?.id;

	const { playlistId } = useParams();

	const [playlistLoading, setPlayListLoading] = useState(false);

	const onErrorHandler = (e) => {
		dispatch({
			type: actionTypes.SET_PLAYER_QUEUE,
			payload: {
				name: feedType,
				data: {
					error: helper.apiErrorHandler(e),
				},
			},
		});
	};

	const loadPlayListInfo = ({ replace = false } = {}) => {
		setPlayListLoading(true);
		// just get search params if exists
		const nextLink = !playlist?.playlistItems?.next
			? ""
			: new URL(playlist?.playlistItems?.next).search.slice(1);

		// force it means start in to just fetch first part
		const query = nextLink ? nextLink + "&" : "";

		fetcher(
			`/api/playlistFullInfo/${playlistId}${
				"?" + (!replace ? query : "") + "userId=" + userInfo.id
			}`
		)
			.then((e) => {
				if (e.data.error) {
					onErrorHandler(e);
					return;
				}

				const res = e.data.result;

				let lastRes = playlist?.playlistItems?.items ?? {};
				lastRes =
					Object.keys(lastRes).length && !replace ? lastRes : {};

				e.data.result.playlistItems.items.forEach((e) => {
					if (!lastRes[e.id]) lastRes[e.track.id] = e.track;
				});
				e.data.result.playlistItems.items = lastRes;

				dispatch({
					type: actionTypes.SET_PLAYER_QUEUE,
					payload: {
						name: feedType,
						data: e.data.result,
					},
				});
			})
			.catch(onErrorHandler)
			.finally(() => {
				setPlayListLoading(false);
			});
	};
	// clean last info

	useEffect(() => {
		if (Object.keys(playlist).length) {
			console.log("clean up");
			dispatch({
				type: actionTypes.SET_PLAYER_QUEUE,
				payload: {
					name: feedType,
					data: {},
				},
			});
			return;
		}
		loadPlayListInfo();
	}, [playlistId]);
	useEffect(() => {
		if (!Object.keys(playlist).length) {
			loadPlayListInfo();
		}
	}, [playlist]);

	const onLoadMore = () => {
		if (playlists?.playlistItems?.next) return;

		loadPlayListInfo();
	};

	useEffect(() => {
		const action = (e) => {
			const html = document.documentElement;
			if (playlistLoading) {
				return;
			}

			const isLoadedAllItems =
				playlist?.name != null &&
				playlist.playlistItems?.total >
					Object.values(playlist.playlistItems.items).length;

			const isRechedToEndOfScroll =
				html.clientHeight + html.scrollTop >= html.scrollHeight;

			// load more if reached to end of scroll and if is there new items

			if (!(isRechedToEndOfScroll && isLoadedAllItems)) return;

			onLoadMore();
		};

		window.addEventListener("scroll", action);

		return () => {
			window.removeEventListener("scroll", action);
		};
	}, [playlist]);

	const backgroundImg = useMemo(
		() => helper.getHighSizeImage(playlist?.images),
		[playlist]
	);

	const itemsArray = Object.values(playlist?.playlistItems?.items ?? {});

	return (
		<div className="playlist min-h-screen">
			{playlist?.name ? (
				<>
					<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
						<div className="flex flex-col gap-2">
							<h1
								title={playlist?.name}
								className="md:text-5xl text-lg font-bold activeColor  min-h-[4rem]"
							>
								<LinkWithBorder
									to={`/playlist/${playlist?.id}`}
								>
									{playlist?.name}
								</LinkWithBorder>
							</h1>

							<div className="flex gap-2 items-center">
								<RiUserFollowLine className="activeColor" />
								<span className="activeColor">
									{playlist?.followers?.total?.toLocaleString()}
								</span>
								Fallowers{" "}
								{playlist?.owner?.display_name ? (
									<>
										By Owner{" "}
										<LinkWithBorder
											to={`/${playlist?.owner.type}/${playlist?.owner.id}`}
										>
											{playlist?.owner?.display_name}
										</LinkWithBorder>
									</>
								) : null}
							</div>
						</div>

						<div className="flex items-center justify-center gap-5 self-end lg:self-auto  w-full lg:justify-end">
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

							<Follow
								target={playlist}
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
						{itemsArray.length && itemsArray.find((e) => e) ? (
							itemsArray?.map?.((e, k) => {
								return e ? (
									<SongItem
										key={e.id}
										numberId={k + 1}
										songInfo={e}
										feedType={feedType}
									/>
								) : (
									<div
										className="hidden"
										key={
											Object.keys(
												playlist?.playlistItems?.items
											)[k]
										}
									></div>
								);
							})
						) : (
							<NotFound
								show={!playlistLoading}
								className="min-h-[250px] h-screen-[50vh] flex justify-center items-center text-lg"
							/>
						)}
					</div>
				</>
			) : (
				<NotFound
					show={!playlistLoading && playlist.error != null}
					text={playlist.error}
					className="min-h-[250px] h-screen-[50vh] flex justify-center items-center text-lg md:text-3xl"
				/>
			)}

			<RingCenterdLoader isLoaded={!playlistLoading} />
		</div>
	);
}

export default PlayList;
