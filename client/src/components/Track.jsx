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
import { useParams } from "react-router-dom";
import "./Track.css";
function Track({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const { trackId } = useParams();

	const playerQueue = allPlayerQueue[feedType] ?? {};

	const [trackLoadingDone, setTrackLoadingDone] = useState(false);
	const [lyric, setLyric] = useState("");
	const [track, setTrack] = useState({});

	const [lyricsLoadingIsDone, setLyricsLoadingIsDone] = useState(true);

	const backgroundImg = useMemo(() => {
		const targetImage = track?.album?.images?.reduce?.((e, n) => {
			return e.width + e.height <= n.width + n.height ? n : e;
		});
		return targetImage?.url;
	}, [track]);

	useEffect(() => {
		setTrackLoadingDone(false);

		fetcher(`/api/track/${trackId}`)
			.then((e) => {
				if (e.data.error) {
					return;
				}
				setTrack(e.data.result);
			})
			.catch((e) => {
				console.log(e);
				// alert("sorry couldn't get Seggestions");
			})
			.finally(() => {
				setTrackLoadingDone(true);
			});
	}, [trackId]);

	// SET_PLAYER_STATE

	useEffect(() => {
		if (!track.name) return;

		setLyricsLoadingIsDone(false);

		console.log(track);
		const artistName = track.artists.map((e) => e.name).join(" ");
		const query = `artists=${encodeURIComponent(
			artistName
		)}&name=${encodeURIComponent(track.name)}`;
		fetcher(`/api/track/lyrics?${query}`)
			.then((e) => {
				if (e.data.error) {
					setLyric("No Lyrics Found!");
					return;
				}
				setLyric(e.data.result);
			})
			.catch((e) => {
				console.log(e);
				setLyric("No Lyrics Found!");
				// alert("sorry couldn't get Seggestions");
			})
			.finally(() => {
				setLyricsLoadingIsDone(true);
			});
	}, [track]);

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
			<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
				<div className="flex flex-col gap-2">
					<h1
						title={track?.name}
						className="md:text-5xl text-lg font-bold activeColor max-w-[350px] md:truncate min-h-[4rem]"
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
				<div className="flex gap-5 self-end lg:self-auto">
					<FeedPlayBtn />
				</div>
			</FeedHead>

			<div className="track__lyric flex flex-col whitespace-pre p-5">
				<ArrangeLyrics text={lyric} />
			</div>
			<RingCenterdLoader
				isLoaded={trackLoadingDone && lyricsLoadingIsDone}
			/>
		</div>
	);
}

export default Track;
