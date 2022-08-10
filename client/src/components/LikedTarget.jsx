import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

import { useEffect, useState, useMemo } from "react";
import { RiUserFollowLine } from "@react-icons/all-files/ri/RiUserFollowLine";
import { GoCheck } from "@react-icons/all-files/go/GoCheck";
import { RingCenterdLoader } from "./Loading";
import { IoMdHeart } from "@react-icons/all-files/io/IoMdHeart";

import SongItem from "./SongItem";
import LinkWithBorder from "./LinkWithBorder";
import Follow from "./Follow";
import FeedHead from "./FeedHead";
import FeedPlayBtn from "./FeedPlayBtn";
import Like from "./Like";
import heartImage from "../imgs/heart.png";
import { useParams } from "react-router-dom";
function LikedTarget({ feedType, target, targetType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const likedTarget = allPlayerQueue[feedType] ?? {};
	const [likedTargetLoading, setLikedTargetLoading] = useState(false);

	const backgroundImg = heartImage;

	const playListDataHandler = (e) => {
		if (e.data.error) {
			console.error("sorry couldn't get playlist");
			return;
		}

		const lastRes = likedTarget?.items ?? {};

		e.data.result.items.forEach((e) => {
			if (!lastRes[e.id]) lastRes[e.id] = e;
		});
		e.data.result.items = lastRes;

		dispatch({
			type: actionTypes.SET_PLAYER_QUEUE,
			payload: {
				name: feedType,
				data: { ...e.data.result },
			},
		});
	};

	const loadMoreEpisodeItems = () => {
		if (likedTargetLoading) return;

		setLikedTargetLoading(true);

		// just get search params if exists
		const nextLink = !likedTarget?.next
			? ""
			: new URL(likedTarget?.next).search.slice(1);

		// force it means start in to just fetch first part
		const query = nextLink ? "?" + nextLink : "";

		const url = `/api/likedTarget/${targetType}${query}`;

		fetcher(url)
			.then(playListDataHandler)
			.catch(console.error)
			.finally((e) => {
				setLikedTargetLoading(false);
			});
	};

	useEffect(() => {
		if (!likedTarget?.items) return;

		const action = (e) => {
			const html = document.documentElement;
			if (likedTargetLoading) {
				return;
			}

			const isLoadedAllItems = likedTarget?.next != null;

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
	}, [likedTarget]);

	useEffect(() => {
		if (likedTarget.items == null) loadMoreEpisodeItems();
	}, [likedTarget]);

	return (
		<div className="track">
			<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
				<div className="flex flex-col gap-2">
					<h1
						title={"LIKED " + target.toUpperCase()}
						className="md:text-5xl text-lg font-bold activeColor "
					>
						<LinkWithBorder to={`/${target}/`}>
							Liked {target.slice(5)}
						</LinkWithBorder>
					</h1>

					<div className="flex gap-2 items-center"></div>
				</div>
				<div className="flex items-center justify-center gap-5 self-end lg:self-auto  w-full lg:justify-end">
					<div className="flex gap-2 items-center">
						<RiUserFollowLine className="activeColor" />
						<span className="activeColor">
							{userInfo?.display_name ? (
								<>
									<LinkWithBorder
										to={`/${userInfo?.type}/${userInfo?.id}`}
									>
										{userInfo?.display_name}
									</LinkWithBorder>
								</>
							) : null}
						</span>
					</div>
				</div>
			</FeedHead>
			<div className="p-3">
				<div className="likedTarget__songs flex flex-col">
					{likedTarget?.items &&
						Object.values(likedTarget?.items)?.map?.((e, k) => {
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

			<RingCenterdLoader isLoaded={!likedTargetLoading} />
		</div>
	);
}
export default LikedTarget;