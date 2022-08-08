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
function Episode({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const { episodeId } = useParams();

	const [episodeLoading, setEpisodeLoading] = useState(false);
	const episode = allPlayerQueue[feedType] ?? {};

	const backgroundImg = useMemo(() => {
		const targetImage = episode?.images?.reduce?.((e, n) => {
			e.width = e.width ?? 0;
			e.height = e.height ?? 0;

			return e.width + e.height <= n.width + n.height ? n : e;
		});
		return targetImage?.url;
	}, [episode]);

	useEffect(() => {
		setEpisodeLoading(true);

		fetcher(`/api/episode/${episodeId}`)
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
				setEpisodeLoading(false);
			});
	}, [episodeId]);

	return (
		<div className="episode">
			<FeedHead backgroundImg={backgroundImg} feedType={feedType}>
				<div className="flex flex-col gap-2">
					<h1
						title={episode?.name}
						className="md:text-3xl text-lg font-bold activeColor  min-h-[4rem]"
					>
						<LinkWithBorder to={`/episode/${episode?.id}`}>
							{episode?.name}
						</LinkWithBorder>
					</h1>
					<div className="flex gap-2 items-center">
						<RiUserFollowLine className="activeColor" />
						<span className="activeColor">
							{episode?.show?.publisher ? (
								<>
									Publisher{" "}
									<LinkWithBorder
										to={`/${episode?.show?.type}/${episode?.show?.id}`}
									>
										{episode?.show?.publisher}
									</LinkWithBorder>
								</>
							) : null}
						</span>
					</div>
				</div>
				<div className="flex items-center justify-center gap-5 self-end lg:self-auto  w-full lg:justify-end">
					<FeedPlayBtn />
					<div className="scale-150 cursor-pointer">
						<Like item={episode} feedType={feedType} />
					</div>
				</div>
			</FeedHead>

			<div className="p-3">
				<div className="text-xl">{episode?.description}</div>

				<div className="p-2">
					<LinkWithBorder
						to={`/${episode?.show?.type}/${episode?.show?.id}`}
					>
						See More Episodes ({episode?.show?.total_episodes})
					</LinkWithBorder>
				</div>
			</div>

			<RingCenterdLoader isLoaded={!episodeLoading} />
		</div>
	);
}

export default Episode;
