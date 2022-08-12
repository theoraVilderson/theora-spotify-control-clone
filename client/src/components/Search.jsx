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
import SearchResultItem from "./SearchResultItem";
import NotFound from "./NotFound";
import heartImage from "../imgs/heart.png";
import { useSearchParams } from "react-router-dom";
import { helper } from "../libs/helper";
function Search({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const search = allPlayerQueue[feedType] ?? {};
	const [searchLoading, setSearchLoading] = useState(false);

	const searchQuery = useSearchParams()[0].get("query");

	const backgroundImg = heartImage;
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
	const searchHandler = (e) => {
		if (e.data.error) {
			onErrorHandler(e);
			return;
		}

		const lastRes = search ?? {};

		Object.keys(e.data.result).forEach((searchType) => {
			const item = e.data.result[searchType];

			item.items = item.items.reduce((p, e) => {
				p[e.id] = e;
				return p;
			}, {});
			lastRes[searchType] = item;
		});

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

		const query = `?query=${searchQuery}`;

		const url = `/api/search${query}`;

		fetcher(url)
			.then(searchHandler)
			.catch(onErrorHandler)
			.finally((e) => {
				setSearchLoading(false);
			});
	};

	useEffect(() => {
		if (!searchQuery?.trim?.()) return;

		if (Object.keys(search).length) {
			dispatch({
				type: actionTypes.SET_PLAYER_QUEUE,
				payload: {
					name: feedType,
					data: null,
				},
			});
		}
		searchAction(searchQuery);
	}, [searchQuery]);

	const notFound = !!!Object.keys(search)
		?.map?.((keyName, k) => {
			const item = search[keyName];
			return Object.values(item.items).length;
		})
		?.find?.((e) => e);

	return (
		<div className="track">
			{Object.keys(search).length ? (
				<>
					<h1 className="md:text-4xl text-lg font-bold activeColor p-2 ">
						Search
					</h1>
					<div className="p-3">
						{!notFound ? (
							<div className="search__songs flex flex-col">
								{Object.keys(search)?.map?.((keyName, k) => {
									const item = search[keyName];
									return (
										<SearchResultItem
											key={keyName}
											searchItem={item}
											searchItemType={keyName}
											feedType={feedType}
										/>
									);
								})}
							</div>
						) : (
							<NotFound
								className="min-h-[250px] h-screen-[50vh] flex justify-center items-center text-lg md:text-3xl"
								text={search.error}
							/>
						)}
					</div>
				</>
			) : null}

			<RingCenterdLoader isLoaded={!searchLoading} />
		</div>
	);
}
export default Search;
