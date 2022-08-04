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

function Player() {
	const [globalData, dispatch] = useGlobalContext();
	let { userInfo, tokens, activeMusic, playerState } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const [updateOnDefaultChange, setUpdateOnDefaultChange] = useState(true);
	const [updateOnDefaultIsDisabled, setUpdateOnDefaultIsDisabled] =
		useState(false);
	const isFree =
		["free", "open"].includes(userInfo?.product) ||
		userInfo?.product == null;
	activeMusic = useMemo(() => activeMusic, [activeMusic]);

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
					payload: e.data.result.item.id,
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

			stateChecker();

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
	const onHitgoBack = () => {
		seekTo(Math.max(range - 5, 0) * 1000);
	};
	const onHitgoForward = () => {
		seekTo(Math.min(maxDuration, range + 5) * 1000);
	};

	return (
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
				{!activeMusicItem ? null : (
					<>
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
											{activeMusicItem.artists.map(
												(e, k) => {
													return (
														<>
															{(k && ",") || null}

															<Link
																to={`/artist/${e.id}`}
																className={`border-b break-all hover:border-current border-solid border-transparent ${
																	(k &&
																		"mx-1") ||
																	"mr-1"
																} `}
															>
																{e.name}
															</Link>
														</>
													);
												}
											)}
										</div>
									</div>
								}
							</div>
						</div>

						<div className="flex flex-col items-center gap-1">
							<div className="flex gap-3 items-center">
								<FaStepBackward className="cursor-pointer" />
								<FaBackward
									onClick={onHitgoBack}
									className="cursor-pointer"
								/>

								<div
									className="cursor-pointer inline-flex rounded-full w-8 h-8 items-center justify-center"
									style={{
										backgroundColor: "var(--text-base)",
										color: "var(--background-press)",
									}}
									onClick={onHitPlayPauseBtn}
								>
									{playerState.is_playing ? (
										<FaPause />
									) : (
										<FaPlay />
									)}
								</div>

								<FaForward
									onClick={onHitgoForward}
									className="cursor-pointer"
								/>
								<FaStepForward className="cursor-pointer" />
							</div>
							<div className=" flex gap-3">
								<div>
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
								<div>
									{playerState.repeat_state === "track" ? (
										<MdRepeatOne className="selectedColor" />
									) : (
										<MdRepeat
											className={`${
												playerState.repeat_state ===
												"off"
													? ""
													: "selectedColor"
											}`}
										/>
									)}
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

export default Player;
