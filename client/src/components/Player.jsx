import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import SliderRange from "./SliderRange";
import { MdExplicit } from "@react-icons/all-files/md/MdExplicit";
import { FaForward } from "@react-icons/all-files/fa/FaForward";
import { FaStepForward } from "@react-icons/all-files/fa/FaStepForward";
import { FaStepBackward } from "@react-icons/all-files/fa/FaStepBackward";
import { FaBackward } from "@react-icons/all-files/fa/FaBackward";
import { FaPlay } from "@react-icons/all-files/fa/FaPlay";
import { FaPause } from "@react-icons/all-files/fa/FaPause";
import { FaShareAlt } from "@react-icons/all-files/fa/FaShareAlt";
import { TiArrowShuffle } from "@react-icons/all-files/ti/TiArrowShuffle";
import { MdRepeat } from "@react-icons/all-files/md/MdRepeat";
import { MdRepeatOne } from "@react-icons/all-files/md/MdRepeatOne";

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

// TODO make the timer for updating data faster
function Player({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	let {
		userInfo,
		tokens,
		activeMusic,
		playerState,
		playerQueue: allPlayerQueue,
	} = globalData;
	const fetcher = useFetcher([globalData, dispatch]);
	const playerQueue = allPlayerQueue[feedType] ?? {};

	const [updateOnDefaultChange, setUpdateOnDefaultChange] = useState(true);
	const [updateOnDefaultIsDisabled, setUpdateOnDefaultIsDisabled] =
		useState(false);
	const isFree =
		["free", "open"].includes(userInfo?.product) ||
		userInfo?.product == null;
	activeMusic = useMemo(() => activeMusic?.id, [activeMusic]);

	const [range, setRange] = useState(
		~~((playerState?.progress_ms ?? 1000) / 1000)
	);

	const stateChecker = () => {
		fetcher(`/api/player/`)
			.then((e) => {
				if (e.data.error) {
					return;
				}
				if (!e?.data?.result) return;

				dispatch({
					type: actionTypes.SET_PLAYER_STATE,
					payload: e.data.result,
				});
				dispatch({
					type: actionTypes.SET_ACTIVE_MUSIC,
					payload: e.data.result.item,
				});
			})
			.catch((e) => {
				console.log(e);
				// alert(`sorry couldn't get currently-playing`);
			})
			.finally(() => {});
	};

	const activeMusicItem = playerState?.item;

	const seekTo = function (range) {
		fetcher(`/api/player/seek?position_ms=${range}`, {
			method: "PUT",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				if (!e?.data?.result) return;
			})
			.catch((e) => {
				console.log(e);
				// alert(`sorry couldn't get currently-playing`);
			})
			.finally(() => {
				setUpdateOnDefaultChange(true);
			});
	};
	useEffect(
		(e) => {
			if (!updateOnDefaultIsDisabled) return;
			setUpdateOnDefaultIsDisabled(false);
			seekTo(range * 1000);
		},
		[updateOnDefaultIsDisabled]
	);
	useEffect(() => {
		stateChecker();
	}, [activeMusic]);

	useEffect(() => {
		let timer = true;
		const action = (timer = setTimeout(function time() {
			if (timer == null) return 1;

			// stateChecker();

			return (timer = setTimeout(time, 5000));
		}, 500));

		return () => {
			timer = clearTimeout(timer);
		};
	}, []);

	const calcMilli = (num) => {
		const hours = ~~((num / 1000 / 60 / 60) % 24);
		const mins = ~~((num / 1000 / 60) % 60);
		const secs = ~~((num / 1000) % 60);
		const lastRes = `${(hours && ("0" + hours).slice(-2) + ":") || ""}${
			("0" + mins).slice(-2) + ":"
		}${("0" + secs).slice(-2)}`;
		return lastRes;
	};
	const currentProgress = ~~((playerState?.progress_ms ?? 1000) / 1000);
	const maxDuration = ~~((playerState?.item?.duration_ms ?? 122000) / 1000);
	const durationCalced = useMemo(() => {
		return calcMilli(maxDuration * 1000);
	}, [maxDuration]);

	const currentCalced = useMemo(() => {
		return calcMilli(currentProgress * 1000);
	}, [currentProgress]);

	const onHitPlayPauseBtn = () => {
		if (!activeMusicItem) {
			const id = playerQueue[0].id ?? playerQueue[0]?.track?.id;

			fetcher(`/api/player/play/?uris=${id}`, {
				method: "PUT",
			})
				.then((e) => {
					if (e.data.error) {
						return;
					}
				})
				.catch((e) => {
					console.log(e);
					alert(`sorry couldn't play`);
				})
				.finally(() => {});

			return;
		}

		fetcher(`/api/player/${playerState.is_playing ? "pause" : "play"}`, {
			method: "PUT",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				if (!e?.data?.result) return;
			})
			.catch((e) => {
				console.log(e);
				// alert(`sorry couldn't get currently-playing`);
			})
			.finally(() => {});
	};
	const onHitGoBack = () => {
		seekTo(Math.max(range - 5, 0) * 1000);
	};
	const onHitGoForward = () => {
		seekTo(Math.min(maxDuration, range + 5) * 1000);
	};

	const calcNextIds = (forwardCount = 1) => {
		if (!Object.keys(playerQueue).length || !playerQueue[activeMusic])
			return activeMusic;

		const orderedSongs = Object.values(playerQueue).sort(
			(a, b) => a.orderId - b.orderId
		);
		const item = playerQueue[activeMusic];

		let startItem = item.orderId - forwardCount;

		startItem =
			startItem < 0
				? orderedSongs.slice(startItem)[0].orderId
				: startItem % orderedSongs.length;

		const firstHalf = orderedSongs.slice(startItem, orderedSongs.length);
		const secondHalf = orderedSongs.slice(0, startItem + 1);
		const lastRes = [...firstHalf, ...secondHalf]
			.map((e) => e.id)
			.join(",");

		return lastRes;
	};
	const nextPlayIds = useMemo(() => calcNextIds(1), [playerQueue]);
	const perviousPlayIds = useMemo(() => calcNextIds(-1), [playerQueue]);

	const onHitGoForwardStep = () => {
		if (!nextPlayIds) return;
		fetcher(`/api/player/play?uris=${nextPlayIds}`, {
			method: "PUT",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				if (!e?.data?.result) return;
			})
			.catch((e) => {
				console.log(e);
				// alert(`sorry couldn't get currently-playing`);
			})
			.finally(() => {});
	};
	const onHitGoBackStep = () => {
		if (!perviousPlayIds) return;

		fetcher(`/api/player/play?uris=${perviousPlayIds}`, {
			method: "PUT",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				if (!e?.data?.result) return;
			})
			.catch((e) => {
				console.log(e);
				// alert(`sorry couldn't get currently-playing`);
			})
			.finally(() => {});
	};

	const onHitReapet = () => {
		const states = ["off", "context", "track"];

		const nextState =
			states[
				Math.max(
					Math.min(0, states.indexOf(playerState.repeat_state) + 1),
					3
				)
			];

		fetcher(`/api/player/repeat?state=${nextState}`, {
			method: "PUT",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				if (!e?.data?.result) return;
			})
			.catch((e) => {
				console.log(e);
				// alert(`sorry couldn't get currently-playing`);
			})
			.finally(() => {});
	};

	const onHitShuffle = () => {
		const nextState = !playerState.shuffle_state;

		fetcher(`/api/player/shuffle?state=${nextState ? "true" : "false"}`, {
			method: "PUT",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				if (!e?.data?.result) return;
			})
			.catch((e) => {
				console.log(e);
				// alert(`sorry couldn't get currently-playing`);
			})
			.finally(() => {});
	};

	return !activeMusicItem ? null : (
		<div className="flex flex-col player activeBgColor justify-start sticky  bottom-0 min-h-20">
			<div className="player__head w-full">
				<SliderRange
					onSliderChange={([val]) => {
						setRange(val);
					}}
					defaultValues={[currentProgress]}
					disabled={isFree}
					step={1}
					min={0}
					max={maxDuration}
					width="100%"
					onSliderDone={() => {
						if (isFree) return;
						setUpdateOnDefaultIsDisabled(true);
					}}
					onSliderStart={() => {
						if (isFree) return;
						setUpdateOnDefaultChange(false);
					}}
					updateOnDefaultChange={updateOnDefaultChange}
				/>
			</div>
			<div className="flex-1 flex items-center justify-around p-1  flex-wrap gap-3">
				<div className="flex items-center w-full sm:w-auto justify-around">
					<div>
						<img
							className="w-12 h-12"
							src={
								activeMusicItem?.images?.[0]?.url ||
								activeMusicItem?.album?.images?.[0]?.url
							}
							alt="songImg"
						/>
					</div>
					<div className="ml-2">
						{
							<div className="text-xs flex flex-col justify-around">
								<div>
									<Link
										to={`/track/${activeMusicItem.id}`}
										className="border-b break-all hover:border-current border-solid border-transparent font-bold activeColor"
									>
										{activeMusicItem.name}
									</Link>
								</div>
								<div className="flex flex-wrap items-center">
									{activeMusicItem.explicit ? (
										<MdExplicit className="w-4 h-4 m-2 ml-0" />
									) : null}
									{activeMusicItem.artists.map((e, k) => {
										return (
											<span key={k}>
												{(k && ",") || null}

												<Link
													to={`/artist/${e.id}`}
													className={`border-b break-all hover:border-current border-solid border-transparent ${
														(k && "mx-1") || "mr-1"
													} `}
												>
													{e.name}
												</Link>
											</span>
										);
									})}
								</div>
							</div>
						}
					</div>
				</div>

				<div className="flex flex-col items-center gap-1">
					<div className="flex gap-3 items-center">
						<FaStepBackward
							className="cursor-pointer"
							onClick={onHitGoBackStep}
						/>
						<FaBackward
							onClick={onHitGoBack}
							className="cursor-pointer"
						/>

						<div
							className={`cursor-pointer inline-flex rounded-full w-8 h-8 items-center justify-center ${
								playerState.is_playing
									? "player_playing"
									: "player_pause"
							}`}
							style={{
								backgroundColor: "var(--text-base)",
								color: "var(--background-press)",
							}}
							onClick={onHitPlayPauseBtn}
						>
							{playerState.is_playing ? <FaPause /> : <FaPlay />}
						</div>

						<FaForward
							onClick={onHitGoForward}
							className="cursor-pointer"
						/>
						<FaStepForward
							onClick={onHitGoForwardStep}
							className="cursor-pointer"
						/>
					</div>
					<div className=" flex gap-3">
						<div className="cursor-pointer" onClick={onHitShuffle}>
							<TiArrowShuffle
								className={`${
									playerState.shuffle_state
										? "selectedColor"
										: ""
								}`}
							/>
						</div>
						<div className="text-xs">
							{currentCalced}/{durationCalced}
						</div>
						<div onClick={onHitReapet} className="cursor-pointer">
							{playerState.repeat_state === "track" ? (
								<MdRepeatOne className="selectedColor" />
							) : (
								<MdRepeat
									className={`${
										playerState.repeat_state === "off"
											? ""
											: "selectedColor"
									}`}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Player;
