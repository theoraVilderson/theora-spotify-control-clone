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
function Episode({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const { episodeId } = useParams();

	const [episodeLoading, setEpisodeLoading] = useState(false);
	const episode = allPlayerQueue[feedType] ?? {};

	const backgroundImg = useMemo(
		() => helper.getHighSizeImage(episode?.images),
		[episode]
	);

	// clean last info
	useEffect(() => {
		if (Object.keys(episode).length) {
			dispatch({
				type: actionTypes.SET_PLAYER_QUEUE,
				payload: {
					name: feedType,
					data: {},
				},
			});
		}
	}, [episodeId]);

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
		setEpisodeLoading(true);

		fetcher(`/api/episode/${episodeId}`)
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
				setEpisodeLoading(false);
			});
	}, [episodeId]);

	return (
		<div className="episode">
			{episode?.name ? (
				<>
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
								See More Episodes (
								{episode?.show?.total_episodes})
							</LinkWithBorder>
						</div>
					</div>
				</>
			) : (
				<NotFound
					show={!episodeLoading && episode.error != null}
					text={episode.error}
					className="min-h-[250px] h-screen-[50vh] flex justify-center items-center text-lg md:text-3xl"
				/>
			)}

			<RingCenterdLoader isLoaded={!episodeLoading} />
		</div>
	);
}

export default Episode;
