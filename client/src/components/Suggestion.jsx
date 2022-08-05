import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

import { useEffect, useState, useMemo } from "react";
import { BsThreeDots } from "@react-icons/all-files/bs/BsThreeDots";
import { RiUserFollowLine } from "@react-icons/all-files/ri/RiUserFollowLine";
import { GoCheck } from "@react-icons/all-files/go/GoCheck";
import { RingLoader } from "./Loading";
import SongItem from "./SongItem";

import { Link } from "react-router-dom";
function Suggestion({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const playerQueue = allPlayerQueue[feedType] ?? {};

	const activeMusicId = activeMusic?.id;
	const [suggestions, setSuggestions] = useState({});
	const backgroundImg = useMemo(() => {
		const targetImage = suggestions?.targetArtist?.images?.reduce?.(
			(e, n) => {
				return e.width + e.height <= n.width + n.height ? n : e;
			}
		);
		return targetImage?.url;
	}, [suggestions]);
	const [isFollowed, setIsFollowed] = useState(false);
	const [loadingPlaylistDone, setLoadingPlaylistDone] = useState(false);

	useEffect(() => {
		if (activeMusicId == null && !Object.keys(suggestions).length) return;
		setLoadingPlaylistDone(false);
		fetcher("/api/suggestions")
			.then((e) => {
				if (e.data.error) {
					return;
				}
				console.log(e.data.result);

				const res = e.data.result.tracks.reduce((e, k, key) => {
					e[k.id] = k;
					e[k.id].orderId = key;
					return e;
				}, {});
				dispatch({
					type: actionTypes.SET_PLAYER_QUEUE,
					payload: { name: feedType, data: res },
				});
				setSuggestions(e.data.result);
			})
			.catch((e) => {
				console.log(e);
				// alert("sorry couldn't get Seggestions");
			})
			.finally(() => {
				setLoadingPlaylistDone(true);
			});
	}, [activeMusicId]);

	// SET_PLAYER_STATE

	const [isProcessFollow, setIsProcessFollow] = useState(false);

	const onHitFollow = () => {
		if (isProcessFollow || !suggestions?.targetArtist) return 1;
		setIsProcessFollow(true);

		const aristId = suggestions?.targetArtist.id;
		fetcher(`/api/artist/follow/${aristId}`, {
			method: !isFollowed ? "PUT" : "DELETE",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				setIsFollowed(!isFollowed);
			})
			.catch((e) => {
				console.log(e);
				alert(`sorry couldn't ${isFollowed ? "unFollow" : "follow"}`);
			})
			.finally(() => {
				setIsProcessFollow(false);
			});
	};
	return (
		<div className="suggestions min-h-screen">
			<div
				className="suggestions__top h-[40vh] min-h-[340px] bg-no-repeat "
				style={
					backgroundImg && {
						backgroundImage: `url(${backgroundImg})`,
						backgroundAttachment: "fixed",
						backgroundPosition: "50% 50%",
						backgroundSize: "cover",
						contain: "strict",
						contentVisibility: "auto",
					}
				}
			>
				<div className="w-full h-full bg-[rgba(0,0,0,0.5)] p-4 flex flex-col justify-between">
					<div className="flex justify-between">
						<div className="breadCrump">
							Home /{" "}
							<span className="activeColor">{feedType}</span>
						</div>
						<BsThreeDots className="activeColorHover cursor-pointer" />
					</div>
					<div className="flex lg:justify-between gap-2 lg:items-center flex-col lg:flex-row">
						<div className="flex flex-col gap-2">
							<h1
								title={suggestions?.targetArtist?.name}
								className="text-5xl font-bold activeColor max-w-[350px] truncate min-h-[4rem]"
							>
								<Link
									to={`/artist/${suggestions?.targetArtist?.id}`}
									className="border-b break-all hover:border-current border-solid border-transparent font-bold activeColor"
								>
									{suggestions?.targetArtist?.name}
								</Link>
							</h1>
							<div className="flex gap-2 items-center">
								<RiUserFollowLine className="activeColor" />
								<span className="activeColor">
									{suggestions?.targetArtist?.followers?.total?.toLocaleString()}
								</span>
								Fallowers{" "}
							</div>
						</div>
						<div className="flex gap-5 self-end lg:self-auto">
							<button
								className=" w-20 h-12 activeColor rounded-full"
								style={{
									backgroundColor:
										"var(--text-bright-accent)",
								}}
								onClick={() => {
									document
										.querySelector(".player_playing")
										?.click?.();
								}}
							>
								Play
							</button>
							<button
								onClick={onHitFollow}
								className="bg-transparent  w-32 h-12 rounded-full border-2 border-current border-solid flex justify-center items-center gap-2"
							>
								{isProcessFollow ? (
									<RingLoader
										className=""
										color={window
											.getComputedStyle(
												document.documentElement
											)
											.getPropertyValue("--text-base")}
										width="20px"
										height="20px"
									/>
								) : (
									<>
										{isFollowed ? (
											<GoCheck
												className="w-4 h-4 float-left"
												style={{
													color: "var(--text-base)",
												}}
											/>
										) : null}
										{!isFollowed ? "Follow" : "Following"}
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
			<div className="suggestions__songs flex flex-col">
				{suggestions?.tracks?.map?.((e, k) => {
					return (
						<SongItem
							key={e.id}
							numberId={k + 1}
							songInfo={JSON.stringify(e)}
						/>
					);
				})}
			</div>
			{!loadingPlaylistDone && (
				<div className="flex justify-center items-center">
					<RingLoader />
				</div>
			)}
		</div>
	);
}

export default Suggestion;
