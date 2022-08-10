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
		const targetImage = user?.images?.reduce?.((e, n) => {
			e.width = e.width ?? 0;
			e.height = e.height ?? 0;

			return e.width + e.height <= n.width + n.height ? n : e;
		}, {});
		return targetImage?.url;
	}, [user]);

	useEffect(() => {
		setUserLoading(true);

		fetcher(`/api/user/${userId}`)
			.then((e) => {
				if (e.data.error) {
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
			.catch((e) => {
				console.log(e);
				// alert("sorry couldn't get Seggestions");
			})
			.finally(() => {
				setUserLoading(false);
			});
	}, [userId]);

	const playListDataHandler = (e) => {
		if (e.data.error) {
			console.error("sorry couldn't get playlist");
			return;
		}

		const lastRes = user?.playlists?.items ?? {};

		e.data.result.items.forEach((e) => {
			if (!lastRes[e.id]) lastRes[e.id] = e;
		});

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
			.catch(console.error)
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
		<div className="track">
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
				{user?.playlists?.items?.map?.((e, k) => {
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

			<RingCenterdLoader
				isLoaded={!userLoading && !userPlaylistLoading}
			/>
		</div>
	);
}

export default User;
