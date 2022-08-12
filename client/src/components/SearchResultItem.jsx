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
import { Scrollbar } from "react-scrollbars-custom";

function SearchResultItem({ feedType, searchItem, searchItemType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const [searchItemLoading, setSearchItemLoading] = useState(false);

	const search = allPlayerQueue[feedType] ?? {};

	const backgroundImg = heartImage;

	const searchMoreHandler = (e) => {
		if (e.data.error) {
			return;
		}

		const lastRes = searchItem?.items ?? {};

		e.data.result[searchItemType].items.forEach((e) => {
			if (!lastRes[e.id]) lastRes[e.id] = e;
		});
		e.data.result[searchItemType].items = lastRes;

		dispatch({
			type: actionTypes.SET_PLAYER_QUEUE,
			payload: {
				name: feedType,
				data: { ...search, ...e.data.result },
			},
		});
	};

	const searchMoreAction = () => {
		if (searchItemLoading) return;

		// just get search params if exists
		const nextLink = !searchItem?.next
			? ""
			: new URL(searchItem?.next).search.slice(1);

		// force it means start in to just fetch first part
		let query = nextLink ? nextLink : "";
		if (!query) return;

		const url = `/api/search?${query}`;

		setSearchItemLoading(true);

		fetcher(url)
			.then(searchMoreHandler)
			.catch(console.error)
			.finally((e) => {
				setSearchItemLoading(false);
			});
	};

	const loadMoreOnScroll = (e) => {
		const isLoadedAllItems = searchItem?.next != null;

		const isRechedToEndOfScroll =
			e.clientHeight + e.scrollTop >= e.scrollHeight;

		// load more if reached to end of scroll and if is there new items

		if (!(isRechedToEndOfScroll && isLoadedAllItems)) return;
		searchMoreAction();
	};

	// useEffect(() => {
	// 	if (!searchQuery?.trim?.()) return;

	// 	searchMoreAction(searchQuery);
	// }, [searchQuery]);

	return searchItem?.items && Object.keys(searchItem?.items).length ? (
		<div className="searchResultItem p-3">
			<h1 className="md:text-2xl text-lg font-bold activeColor capitalize">
				{searchItemType}
			</h1>
			<Scrollbar
				style={{ width: "100%", height: 250 }}
				onUpdate={loadMoreOnScroll}
			>
				<div className="p-3">
					<div className="searchResultItem__items flex flex-col">
						{Object.values(searchItem?.items)?.map?.((e, k) => {
							return (
								<SongItem
									key={e.id}
									numberId={k + 1}
									songInfo={e}
									feedType={feedType}
									action={false}
								/>
							);
						})}
					</div>
				</div>

				<RingCenterdLoader isLoaded={!searchItemLoading} />
			</Scrollbar>
		</div>
	) : (
		""
	);
}
export default SearchResultItem;
