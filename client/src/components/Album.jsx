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

function Album({ feedType, route }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const { albumId } = useParams();

	const album = allPlayerQueue[feedType] ?? {};

	const [albumsLoading, setAlbumsLoading] = useState(false);

	const backgroundImg = useMemo(
		() => helper.getHighSizeImage(album?.images),
		[album]
	);

	// clean last info
	useEffect(() => {
		if (Object.keys(album).length) {
			dispatch({
				type: actionTypes.SET_PLAYER_QUEUE,
				payload: {
					name: feedType,
					data: {},
				},
			});
		}
	}, [albumId]);

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

	const loadAlbumItems = (nextLink) => {
		if (albumsLoading) return;

		const theNextLink = !nextLink
			? null
			: new URL(nextLink).search.slice(1);

		setAlbumsLoading(true);

		fetcher(
			`/api/album/${albumId}${
				theNextLink ? "/getAlbumTracks?" + theNextLink : ""
			}`
		)
			.then((e) => {
				if (e.data.error) {
					onErrorHandler(e);
					return;
				}

				let items = !theNextLink
					? e.data.result.tracks.items
					: e.data.result.items;

				const parentContainer = album?.tracks?.items
					? { ...album.tracks.items }
					: {};

				items = items?.reduce?.((e, k) => {
					e[k.id] = k;
					return e;
				}, parentContainer);

				if (theNextLink) {
					e.data.result.items = items;
					album.tracks = e.data.result;

					dispatch({
						type: actionTypes.SET_PLAYER_QUEUE,
						payload: {
							name: feedType,
							data: album,
						},
					});
					return;
				} else {
					// in first call load albaum tracks
					e.data.result.tracks.next = null;
					e.data.result.tracks.items = null;
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
				setAlbumsLoading(false);
			});
	};
	useEffect(() => {
		if (!album?.tracks) loadAlbumItems();
		else if (!album?.tracks?.items) {
			loadAlbumItems(
				"https://api.spotify.com/album/:albumId/albumLinks?offset=0&limit=10"
			);
		}
	}, [album]);

	useEffect(() => {
		const action = (e) => {
			const html = document.documentElement;
			if (
				html.clientHeight + html.scrollTop >= html.scrollHeight &&
				(album?.total == null ||
					album?.total > Object.keys(album?.tracks?.items).length)
			) {
				loadAlbumItems(album?.tracks?.next);
			}
		};
		window.addEventListener("scroll", action);
		return () => {
			window.removeEventListener("scroll", action);
		};
	}, [album]);

	return (
		<div className="artist">
			{album?.name ? (
				<>
					<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
						<div className="flex flex-col gap-2">
							<h1
								title={album?.name}
								className="md:text-5xl text-lg font-bold activeColor  min-h-[4rem]"
							>
								<LinkWithBorder to={`/album/${album?.id}`}>
									{album?.name}
								</LinkWithBorder>
							</h1>
							<div className="flex gap-2 items-center">
								<RiUserFollowLine className="activeColor" />
								<span className="activeColor">
									{album.artists?.map?.((e, k) => {
										return (
											<span key={k}>
												{(k && ",") || null}

												<LinkWithBorder
													key={k}
													to={`/artist/${e.id}`}
													className={`border-b break-all hover:border-current border-solid border-transparent  `}
													isNeedSpace={!!k}
												>
													{e.name}
												</LinkWithBorder>
											</span>
										);
									})}{" "}
								</span>
							</div>
						</div>
						<div className="flex items-center justify-center gap-5 self-end lg:self-auto  w-full lg:justify-end">
							<FeedPlayBtn feedType={feedType} item={album} />
							<div className="scale-150 cursor-pointer">
								<Like item={album} feedType={feedType} />
							</div>
						</div>
					</FeedHead>

					<div className="artist__albums flex flex-col">
						{album.tracks?.items &&
							Object.values(album?.tracks?.items)?.map?.(
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
							)}
					</div>
				</>
			) : (
				<NotFound
					show={!albumsLoading && album.error != null}
					text={album.error}
					className="min-h-[250px] h-screen-[50vh] flex justify-center items-center text-lg md:text-3xl"
				/>
			)}
			<RingCenterdLoader isLoaded={!albumsLoading} />
		</div>
	);
}

export default Album;
