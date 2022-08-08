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
function Show({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const { showId } = useParams();

	const show = allPlayerQueue[feedType] ?? {};
	const [showLoading, setShowLoading] = useState(false);
	const [showEpisodeLoading, setShowEpisodeLoading] = useState(false);

	const backgroundImg = useMemo(() => {
		const targetImage = show.images?.reduce?.((e, n) => {
			e.width = e.width ?? 0;
			e.height = e.height ?? 0;

			return e.width + e.height <= n.width + n.height ? n : e;
		});
		return targetImage?.url;
	}, [show]);

	useEffect(() => {
		setShowLoading(true);

		fetcher(`/api/show/${showId}`)
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
				setShowLoading(false);
			});
	}, [showId]);

	const playListDataHandler = (e) => {
		if (e.data.error) {
			console.error("sorry couldn't get playlist");
			return;
		}

		const lastRes = show?.episodes?.items ?? {};

		e.data.result.items.forEach((e) => {
			if (!lastRes[e.id]) lastRes[e.id] = e;
		});
		e.data.result.items = lastRes;

		dispatch({
			type: actionTypes.SET_PLAYER_QUEUE,
			payload: {
				name: feedType,
				data: { ...show, episodes: e.data.result },
			},
		});
	};

	const loadMoreEpisodeItems = () => {
		if (!show?.id) return;

		if (showEpisodeLoading) return;

		setShowEpisodeLoading(true);

		// just get search params if exists
		const nextLink = !show?.episodes?.next
			? ""
			: new URL(show?.episodes?.next).search.slice(1);

		// force it means start in to just fetch first part
		const query = nextLink ? "?" + nextLink : "";

		const url = `/api/show/${showId}/episodes${query}`;

		fetcher(url)
			.then(playListDataHandler)
			.catch(console.error)
			.finally((e) => {
				setShowEpisodeLoading(false);
			});
	};

	useEffect(() => {
		if (!show?.name) return;

		const action = (e) => {
			const html = document.documentElement;
			if (showEpisodeLoading) {
				return;
			}

			const isLoadedAllItems =
				show?.episodes != null &&
				show?.episodes?.total >
					Object.values(show.episodes.items).length;

			const isRechedToEndOfScroll =
				html.clientHeight + html.scrollTop >= html.scrollHeight;

			// load more if reached to end of scroll and if is there new items

			if (!(isRechedToEndOfScroll && isLoadedAllItems)) return;

			loadMoreEpisodeItems();
		};

		window.addEventListener("scroll", action);

		return () => {
			window.removeEventListener("scroll", action);
		};
	}, [show]);

	useEffect(() => {
		if (show?.name && show.episodes == null) loadMoreEpisodeItems();
	}, [show, showId]);
	return (
		<div className="track">
			<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
				<div className="flex flex-col gap-2">
					<h1
						title={show?.name}
						className="md:text-5xl text-lg font-bold activeColor  min-h-[4rem]"
					>
						<LinkWithBorder to={`/show/${show?.id}`}>
							{show?.name}
						</LinkWithBorder>
					</h1>

					<div className="flex gap-2 items-center">
						<RiUserFollowLine className="activeColor" />
						<span className="activeColor">
							{show?.publisher ? (
								<>
									Publisher{" "}
									<LinkWithBorder
										to={`/${show?.type}/${show?.id}`}
									>
										{show?.publisher}
									</LinkWithBorder>
								</>
							) : null}
						</span>
					</div>
				</div>

				{userInfo.id !== show.id && (
					<div className="flex items-center justify-center gap-5 self-end lg:self-auto  w-full lg:justify-end">
						<div className="scale-150 cursor-pointer">
							<Like item={show} feedType={feedType} />
						</div>
					</div>
				)}
			</FeedHead>
			<div className="p-3">
				<h2 className="text-3xl activeColor py-3">About</h2>
				<p>{show?.description}</p>
			</div>
			<div className="p-3">
				<h2 className="text-3xl activeColor py-3">All Episodes</h2>
				<div className="show__songs flex flex-col">
					{show?.episodes?.items &&
						Object.values(show?.episodes?.items)?.map?.((e, k) => {
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
			</div>

			<RingCenterdLoader isLoaded={!showLoading && !showEpisodeLoading} />
		</div>
	);
}

export default Show;
