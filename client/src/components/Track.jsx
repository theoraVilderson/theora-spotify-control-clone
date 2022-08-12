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
import "./Track.css";
function Track({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const { trackId } = useParams();

	const track = allPlayerQueue[feedType] ?? {};
	const [trackLoading, setTrackLoading] = useState(false);
	const [lyric, setLyric] = useState("");

	const [lyricsLoading, setLyricsLoading] = useState(false);

	console.log(track);
	const backgroundImg = useMemo(
		() => helper.getHighSizeImage(track?.album?.images),
		[track]
	);
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
		setTrackLoading(true);

		fetcher(`/api/track/${trackId}`)
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
				setTrackLoading(false);
			});
	}, [trackId]);

	useEffect(() => {
		if (!track.name) return;

		setLyricsLoading(true);

		const artistName = track.artists.map((e) => e.name).join(" ");
		const query = `artists=${encodeURIComponent(
			artistName
		)}&name=${encodeURIComponent(track.name)}`;

		fetcher(`/api/track/lyrics?${query}`)
			.then((e) => {
				if (e.data.error) {
					setLyric(null);
					return;
				}
				setLyric(e.data.result);
			})
			.catch((e) => {
				onErrorHandler(e);
				setLyric(null);
				// alert("sorry couldn't get Seggestions");
			})
			.finally(() => {
				setLyricsLoading(false);
			});
	}, [track]);

	// clean last info
	useEffect(() => {
		if (Object.keys(track).length) {
			dispatch({
				type: actionTypes.SET_PLAYER_QUEUE,
				payload: {
					name: feedType,
					data: {},
				},
			});
		}
	}, [trackId]);

	const ArrangeLyrics = (...all) => {
		const [{ text = "", direction = "ltr", lineDirection = "rtl" }] = all;
		const lines = text.split("\n");
		const wichWay = (dir) => (dir == "ltr" ? "left" : "right");
		const chunkerPreClass = `autoArrangeText__parent--${wichWay(
			direction
		)}`;
		const chunkerPreClassLine = `autoArrangeText__parent--line-${wichWay(
			lineDirection
		)}`;
		const chunkerClass = `autoArrangeText__chunker`;
		const chunkClass = `autoArrangeText__chunk`;

		return (
			<div
				className={`autoArrangeText__parent ${chunkerPreClass} ${chunkerPreClassLine}`}
			>
				{lines.map((line, key) => {
					return (
						<div key={key} className={`${chunkerClass}`}>
							<div className={`${chunkClass}`}>
								{line.trim() ? line : " "}
							</div>
						</div>
					);
				})}
			</div>
		);
	};
	return (
		<div className="track">
			{track?.name ? (
				<>
					<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
						<div className="flex flex-col gap-2">
							<h1
								title={track?.name}
								className="md:text-5xl text-lg font-bold activeColor  min-h-[4rem]"
							>
								<LinkWithBorder to={`/track/${track?.id}`}>
									{track?.name}
								</LinkWithBorder>
							</h1>
							<div className="flex gap-2 items-center">
								<RiUserFollowLine className="activeColor" />
								<span className="activeColor">
									{track.artists?.map?.((e, k) => {
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
							<FeedPlayBtn />
							<div className="scale-150 cursor-pointer">
								<Like item={track} feedType={feedType} />
							</div>
						</div>
					</FeedHead>

					<div className="track__lyric flex flex-col whitespace-pre p-5">
						{lyric != null ? (
							<ArrangeLyrics text={lyric} />
						) : (
							<h1 className="flex justify-center items-center">
								No Lyrics Found !
							</h1>
						)}
					</div>
				</>
			) : (
				<NotFound
					show={
						!trackLoading && !lyricsLoading && track.error != null
					}
					text={track.error}
					className="min-h-[250px] h-screen-[50vh] flex justify-center items-center text-lg md:text-3xl"
				/>
			)}

			<RingCenterdLoader isLoaded={!trackLoading && !lyricsLoading} />
		</div>
	);
}

export default Track;
