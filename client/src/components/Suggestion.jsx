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
import { helper } from "../libs/helper";

import "./Suggestion.css";
function Suggestion({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const playerQueue = allPlayerQueue[feedType] ?? {};

	const activeMusicId = activeMusic?.id;
	const [suggestions, setSuggestions] = useState({});

	const backgroundImg = useMemo(
		() => helper.getHighSizeImage(suggestions?.targetArtist?.images),
		[suggestions]
	);
	const [isFollowed, setIsFollowed] = useState(false);
	const [loadingPlaylistDone, setLoadingPlaylistDone] = useState(false);

	useEffect(() => {
		setLoadingPlaylistDone(false);
		fetcher("/api/suggestions")
			.then((e) => {
				if (e.data.error) {
					return;
				}

				const res = e.data.result.tracks.reduce((e, k, key) => {
					e[k.id] = k;
					e[k.id].orderId = key;
					return e;
				}, {});
				setSuggestions(e.data.result);
				dispatch({
					type: actionTypes.SET_PLAYER_QUEUE,
					payload: { name: feedType, data: res },
				});
			})
			.catch((e) => {
				console.log(e);
				// alert("sorry couldn't get Seggestions");
			})
			.finally(() => {
				setLoadingPlaylistDone(true);
			});
	}, [activeMusicId]);

	return (
		<div className="suggestions">
			{suggestions?.targetArtist ? (
				<>
					<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
						<div className="flex flex-col gap-2">
							<h1
								title={suggestions?.targetArtist?.name}
								className="md:text-5xl text-lg font-bold activeColor  min-h-[4rem]"
							>
								<LinkWithBorder
									to={`/artist/${suggestions?.targetArtist?.id}`}
								>
									{suggestions?.targetArtist?.name}
								</LinkWithBorder>
							</h1>
							<div className="flex gap-2 items-center">
								<RiUserFollowLine className="activeColor" />
								<span className="activeColor">
									{suggestions?.targetArtist?.followers?.total?.toLocaleString()}
								</span>
								Fallowers{" "}
							</div>
						</div>
						<div className="flex items-center justify-center gap-5 self-end lg:self-auto  w-full lg:justify-end">
							<FeedPlayBtn />

							<Follow
								target={suggestions?.targetArtist}
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
					</FeedHead>

					<div className="suggestions__songs flex flex-col">
						{suggestions?.tracks?.map?.((e, k) => {
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
				</>
			) : null}

			<RingCenterdLoader isLoaded={loadingPlaylistDone} />
		</div>
	);
}

export default Suggestion;
