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
import { useSearchParams } from "react-router-dom";
function Search({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const search = allPlayerQueue[feedType] ?? {};
	const [searchLoading, setSearchLoading] = useState(false);

	const searchQuery = useSearchParams()[0].get("query");

	const backgroundImg = heartImage;

	const playListDataHandler = (e) => {
		if (e.data.error) {
			return;
		}

		// const lastRes = search?.items ?? {};

		// e.data.result.items.forEach((e) => {
		// 	if (!lastRes[e.id]) lastRes[e.id] = e;
		// });
		// e.data.result.items = lastRes;

		dispatch({
			type: actionTypes.SET_PLAYER_QUEUE,
			payload: {
				name: feedType,
				data: { ...e.data.result },
			},
		});
	};

	const searchAction = () => {
		// if (searchLoading) return;

		setSearchLoading(true);

		// just get search params if exists
		const nextLink = !search?.next
			? ""
			: new URL(search?.next).search.slice(1);

		// force it means start in to just fetch first part
		let query = nextLink ? nextLink : "";

		query = `?q=${searchQuery}${query ? "&" + query : ""}`;

		const url = `/api/search${query}`;

		fetcher(url)
			.then(playListDataHandler)
			.catch(console.error)
			.finally((e) => {
				setSearchLoading(false);
			});
	};

	// useEffect(() => {
	// 	if (!search?.items) return;

	// 	const action = (e) => {
	// 		const html = document.documentElement;
	// 		if (searchLoading) {
	// 			return;
	// 		}

	// 		const isLoadedAllItems = search?.next != null;

	// 		const isRechedToEndOfScroll =
	// 			html.clientHeight + html.scrollTop >= html.scrollHeight;

	// 		// load more if reached to end of scroll and if is there new items

	// 		if (!(isRechedToEndOfScroll && isLoadedAllItems)) return;

	// 		searchAction();
	// 	};

	// 	window.addEventListener("scroll", action);

	// 	return () => {
	// 		window.removeEventListener("scroll", action);
	// 	};
	// }, [search]);

	useEffect(() => {
		if (!searchQuery?.trim?.()) return;

		searchAction(searchQuery);
	}, [searchQuery]);

	return (
		<div className="track">
			<h1 className="md:text-5xl text-lg font-bold activeColor ">
				Search
			</h1>
			<div className="p-3">
				<div className="search__songs flex flex-col">
					{search?.items &&
						Object.values(search?.items)?.map?.((e, k) => {
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

			<RingCenterdLoader isLoaded={!searchLoading} />
		</div>
	);
}
export default Search;
