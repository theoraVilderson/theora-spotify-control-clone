import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

import { useEffect, useState, useMemo } from "react";
import { RiUserFollowLine } from "@react-icons/all-files/ri/RiUserFollowLine";
import { GoCheck } from "@react-icons/all-files/go/GoCheck";
import { RingCenterdLoader } from "./Loading";
import SongItem from "./SongItem";
import LinkWithBorder from "./LinkWithBorder";
import Follow from "./Follow";
import FeedHead from "./FeedHead";
import FeedPlayBtn from "./FeedPlayBtn";
import Like from "./Like";
import NotFound from "./NotFound";
import { helper } from "../libs/helper";

import { useParams } from "react-router-dom";
function User({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const { userId } = useParams();

	const user = allPlayerQueue[feedType] ?? {};
	const [userLoading, setUserLoading] = useState(false);
	const [userPlaylistLoading, setUserPlaylistLoading] = useState(false);

	const backgroundImg = useMemo(() => {
		return helper.getHighSizeImage(user?.images);
	}, [user]);

	useEffect(() => {
		if (Object.keys(user).length) {
			dispatch({
				type: actionTypes.SET_PLAYER_QUEUE,
				payload: {
					name: feedType,
					data: {},
				},
			});
		}
	}, [userId]);

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
	useEffect(() => {
		setUserLoading(true);

		fetcher(`/api/user/${userId}`)
			.then((e) => {
				if (e.data.error) {
					onErrorHandler(e);
					return;
				}
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
				setUserLoading(false);
			});
	}, [userId]);

	const playListDataHandler = (e) => {
		if (e.data.error) {
			return;
		}

		const lastRes = user?.playlists?.items ?? {};

		e.data.result.items.forEach((e) => {
			if (!lastRes[e.id]) lastRes[e.id] = e;
		});
		e.data.result.items = lastRes;

		dispatch({
			type: actionTypes.SET_PLAYER_QUEUE,
			payload: {
				name: feedType,
				data: { ...user, playlists: e.data.result },
			},
		});
	};

	const loadMorePlayListItems = () => {
		if (!user?.id) return;

		if (userPlaylistLoading) return;

		setUserPlaylistLoading(true);

		// just get search params if exists
		const nextLink = !user?.playlists?.next
			? ""
			: new URL(user?.playlists?.next).search.slice(1);

		// force it means start in to just fetch first part
		const query = nextLink ? "&" + nextLink : "";

		const url = `/api/playlists?userId=${user.id}${query}&checkLike=true`;

		fetcher(url)
			.then(playListDataHandler)
			.catch(onErrorHandler)
			.finally((e) => {
				setUserPlaylistLoading(false);
			});
	};

	useEffect(() => {
		if (!user?.display_name) return;

		const action = (e) => {
			const html = document.documentElement;
			if (userPlaylistLoading) {
				return;
			}

			const isLoadedAllItems =
				user?.playlists != null &&
				user?.playlists?.total >
					Object.values(user.playlists.items).length;

			const isRechedToEndOfScroll =
				html.clientHeight + html.scrollTop >= html.scrollHeight;

			// load more if reached to end of scroll and if is there new items

			if (!(isRechedToEndOfScroll && isLoadedAllItems)) return;

			loadMorePlayListItems();
		};

		window.addEventListener("scroll", action);

		return () => {
			window.removeEventListener("scroll", action);
		};
	}, [user]);

	useEffect(() => {
		if (user?.display_name && user.playlists == null)
			loadMorePlayListItems();
	}, [user, userId]);

	return (
		<div className="user">
			{user?.display_name ? (
				<>
					<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
						<div className="flex flex-col gap-2">
							<h1
								title={user?.display_name}
								className="md:text-5xl text-lg font-bold activeColor  min-h-[4rem]"
							>
								<LinkWithBorder to={`/user/${user?.id}`}>
									{user?.display_name}
								</LinkWithBorder>
							</h1>

							<div className="flex gap-2 items-center">
								<RiUserFollowLine className="activeColor" />
								<span className="activeColor">
									{user?.followers?.total?.toLocaleString()}
								</span>
								Fallowers{" "}
							</div>
						</div>

						{userInfo.id !== user.id && (
							<div className="flex items-center justify-center gap-5 self-end lg:self-auto  w-full lg:justify-end">
								<Follow
									target={user}
									FollowContent={<>Follow</>}
									UnFollowContent={
										<>
											<GoCheck
												className="w-4 h-4 float-left"
												style={{
													color: "var(--text-base)",
												}}
											/>
											Following
										</>
									}
								/>
							</div>
						)}
					</FeedHead>
					<div className="user__songs flex flex-col">
						{Object.values(user?.playlists?.items ?? {}).length ? (
							Object.values(user?.playlists?.items)?.map?.(
								(e, k) => {
									return (
										<SongItem
											key={e.id}
											numberId={k + 1}
											songInfo={e}
											feedType={feedType}
										/>
									);
								}
							)
						) : (
							<NotFound
								show={!userPlaylistLoading}
								className="min-h-[250px] h-screen-[50vh] flex justify-center items-center text-lg"
							/>
						)}
					</div>
				</>
			) : (
				<NotFound
					show={
						!userLoading &&
						!userPlaylistLoading &&
						user.error != null
					}
					text={user.error}
					className="min-h-[250px] h-screen-[50vh] flex justify-center items-center text-lg md:text-3xl"
				/>
			)}

			<RingCenterdLoader
				isLoaded={!userLoading && !userPlaylistLoading}
			/>
		</div>
	);
}

export default User;
