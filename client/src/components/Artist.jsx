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

function Artist({ feedType, route }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const { artistId } = useParams();

	const playerQueue = allPlayerQueue[feedType] ?? {};

	const artistTopSongs = playerQueue?.artistTopSongs ?? {};
	const artistAlbums = playerQueue?.artistAlbums ?? {};
	const [artist, setArtist] = useState({});
	const [updateCountAlbum, setUpdateCountAlbum] = useState(0);
	const [artistLoading, setArtistLoading] = useState(false);
	const [artistTopSongsLoading, setArtistTopSongsLoading] = useState(false);
	const [artistAlbumsLoading, setArtistAlbumsLoading] = useState(false);

	const backgroundImg = useMemo(() => {
		const targetImage = artist?.images?.reduce?.((e, n) => {
			return e.width + e.height <= n.width + n.height ? n : e;
		});
		return targetImage?.url;
	}, [artist]);

	useEffect(() => {
		setArtistLoading(true);

		fetcher(`/api/artist/${artistId}`)
			.then((e) => {
				if (e.data.error) {
					return;
				}
				console.log("artist", e.data.result);
				setArtist(e.data.result);
			})
			.catch((e) => {
				console.log(e);
				// alert("sorry couldn't get Seggestions");
			})
			.finally(() => {
				setArtistLoading(false);
			});
	}, [artistId]);

	useEffect(() => {
		if (!artist.name || artistTopSongsLoading || route !== "top-songs")
			return;

		const countryCode = userInfo?.country ?? "us";
		setArtistTopSongsLoading(true);
		fetcher(`/api/artist/${artistId}/top-tracks?country=${countryCode}`)
			.then((e) => {
				if (e.data.error) {
					return;
				}
				dispatch({
					type: actionTypes.SET_PLAYER_QUEUE,
					payload: {
						name: feedType,
						data: { ...playerQueue, artistTopSongs: e.data.result },
					},
				});
			})
			.catch((e) => {
				console.log(e);

				// alert("sorry couldn't get Seggestions");
			})
			.finally(() => {
				setArtistTopSongsLoading(false);
			});
	}, [artist, route]);

	const loadAlbumItems = (nextLink) => {
		console.log(!artist.name, artistAlbumsLoading, route !== "albums");
		if (!artist.name || artistAlbumsLoading || route !== "albums") return;

		const theNextLink = !nextLink
			? null
			: new URL(nextLink).search.slice(1);

		console.log(
			`/api/artist/${artistId}/albums${
				theNextLink ? "?" + theNextLink : "?limit=10"
			}`
		);
		setArtistAlbumsLoading(true);

		fetcher(
			`/api/artist/${artistId}/albums${
				theNextLink ? "?" + theNextLink : "?limit=10"
			}`
		)
			.then((e) => {
				if (e.data.error) {
					return;
				}

				const parentContainer = artistAlbums?.items
					? { ...artistAlbums.items }
					: {};

				e.data.result.items = e.data.result.items?.reduce?.((e, k) => {
					e[k.id] = k;
					return e;
				}, parentContainer);

				console.log(e.data.result.items);
				dispatch({
					type: actionTypes.SET_PLAYER_QUEUE,
					payload: {
						name: feedType,
						data: {
							...playerQueue,
							artistAlbums: e.data.result,
						},
					},
				});
			})
			.catch((e) => {
				console.log(e);

				// alert("sorry couldn't get Seggestions");
			})
			.finally(() => {
				setArtistAlbumsLoading(false);
			});
	};
	useEffect(() => {
		loadAlbumItems();
	}, [artist, route]);

	useEffect(() => {
		if (!updateCountAlbum) return;

		console.log(artistAlbums?.next);
		loadAlbumItems(artistAlbums?.next);
	}, [updateCountAlbum]);
	useEffect(() => {
		const action = (e) => {
			const html = document.documentElement;
			if (
				html.clientHeight + html.scrollTop >= html.scrollHeight &&
				(artistAlbums?.total == null ||
					artistAlbums?.total >
						Object.keys(artistAlbums?.items).length)
			) {
				setUpdateCountAlbum((e) => e + 1);
			}
		};
		window.addEventListener("scroll", action);
		return () => {
			window.removeEventListener("scroll", action);
		};
	}, [playerQueue]);

	const linkGen = (subMenue) => {
		return `/artist/${artistId}/${subMenue}`;
	};
	console.log(route);
	return (
		<div className="artist">
			<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
				<div className="flex flex-col gap-2">
					<h1
						title={artist?.name}
						className="md:text-5xl text-lg font-bold activeColor  min-h-[4rem]"
					>
						<LinkWithBorder to={`/artist/${artist?.id}`}>
							{artist?.name}
						</LinkWithBorder>
					</h1>
					<div className="flex gap-2 items-center">
						<RiUserFollowLine className="activeColor" />
						<span className="activeColor">
							{artist?.followers?.total?.toLocaleString()}
						</span>
						Fallowers{" "}
					</div>
				</div>
				<div className="flex items-center justify-center gap-5 self-end lg:self-auto  w-full lg:justify-end">
					<FeedPlayBtn />
					<div className=" cursor-pointer">
						<Follow
							target={artist}
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
				</div>
			</FeedHead>
			<div className="flex gap-2  ">
				<LinkWithBorder to={`${linkGen("top-songs")}`}>
					<div
						className={
							(route === "top-songs" ? "selectedBgColor " : " ") +
							"p-3 flex justify-center items-center"
						}
					>
						Top Songs
					</div>
				</LinkWithBorder>

				<LinkWithBorder to={`${linkGen("albums")}`}>
					<div
						className={
							(route === "albums" ? "selectedBgColor " : " ") +
							"p-3 flex justify-center items-center"
						}
					>
						Albums
					</div>
				</LinkWithBorder>
			</div>

			{route === "albums" && (
				<>
					<div className="artist__albums flex flex-col">
						{artistAlbums?.items &&
							Object.values(artistAlbums?.items)?.map?.(
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
					<RingCenterdLoader
						isLoaded={!artistLoading && !artistAlbumsLoading}
					/>
				</>
			)}

			{route === "top-songs" && (
				<>
					<div className="artist__topSongs flex flex-col">
						{artistTopSongs?.tracks?.map?.((e, k) => {
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
						isLoaded={!artistLoading && !artistTopSongsLoading}
					/>
				</>
			)}
		</div>
	);
}

export default Artist;
