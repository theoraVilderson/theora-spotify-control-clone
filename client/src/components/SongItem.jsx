import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import { FaRegHeart } from "@react-icons/all-files/fa/FaRegHeart";
import { IoMdHeart } from "@react-icons/all-files/io/IoMdHeart";
import { MdExplicit } from "@react-icons/all-files/md/MdExplicit";

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import "./SongItem.css";
function SongItem({ songInfo, numberId }) {
	const {
		name,
		album: { images },
		artists,
		id,
		duration_ms,
		isLiked,
		explicit,
	} = JSON.parse(songInfo);

	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const backgroundImg = useMemo(() => {
		const targetImage = images?.reduce?.((e, n) => {
			return e.width + e.height <= n.width + n.height ? n : e;
		});
		return targetImage?.url;
	}, [images]);

	const [like, setLike] = useState(isLiked);
	const [isLiking, setIsLiking] = useState(false);

	useEffect(() => {
		setLike(isLiked);
	}, [isLiked]);

	const durationCalced = useMemo(() => {
		const hours = ~~((duration_ms / 1000 / 60 / 60) % 24);
		const mins = ~~((duration_ms / 1000 / 60) % 60);
		const secs = ~~((duration_ms / 1000) % 60);
		const lastRes = `${(hours && ("0" + hours).slice(-2) + ":") || ""}${
			("0" + mins).slice(-2) + ":"
		}${("0" + secs).slice(-2)}`;
		return lastRes;
	}, [duration_ms]);

	const onHitLike = () => {
		if (isLiking) return;

		setIsLiking(true);

		fetcher(`/api/track/like/${id}`, {
			method: !like ? "PUT" : "DELETE",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				setLike(!like);
			})
			.catch((e) => {
				console.log(e);
				alert(`sorry couldn't ${like ? "unLike" : "like"}`);
			})
			.finally(() => {
				setIsLiking(false);
			});
	};
	const isActiveSong = id === activeMusic;

	return (
		<div
			className={`song  flex flex-col sm:flex-row justify-between cursor-pointer group ${
				isActiveSong ? "selectedColor" : "activeColorHover"
			} `}
		>
			<div className="flex gap-2 p-3 flex-col sm:flex-row items-center flex-wrap sm:flex-nowrap sm:items-center">
				<div
					className={`w-full sm:w-10 flex justify-center items-center text-2xl sm:text-sm shrink-0`}
				>
					#{numberId}
				</div>
				<div className="w-[70vw] sm:w-12 sm:h-12 rounded overflow-hidden shrink-0">
					{backgroundImg && (
						<img
							className="w-full sm:w-12 sm:h-12 group-hover:scale-150 duration-100"
							src={backgroundImg}
							alt="SongImg"
						/>
					)}
				</div>
				<div className="text-xs flex flex-col justify-around">
					<div>
						<Link
							to={`/track/${id}`}
							className="border-b break-all hover:border-current border-solid border-transparent font-bold activeColor"
						>
							{name}
						</Link>
					</div>
					<div className="flex flex-wrap items-center">
						{explicit ? (
							<MdExplicit className="w-4 h-4 m-2 ml-0" />
						) : null}
						{artists.map((e, k) => {
							return (
								<>
									{(k && ",") || null}

									<Link
										to={`/artist/${e.id}`}
										className={`border-b break-all hover:border-current border-solid border-transparent ${
											(k && "mx-1") || "mr-1"
										} `}
									>
										{e.name}
									</Link>
								</>
							);
						})}
					</div>
				</div>
			</div>
			<div className="flex w-full sm:w-auto justify-between sm:justify-scratch items-center gap-4 p-5">
				<div className="like">
					<span
						onClick={onHitLike}
						className={`${
							!like && !isLiking
								? "inline-block sm:hidden group-hover:inline-block"
								: "inline-block"
						}  ${isLiking ? "animate-spin" : ""}`}
					>
						{!like ? (
							<FaRegHeart className="selectedColor hover:scale-110" />
						) : (
							<IoMdHeart className="selectedColor hover:scale-90" />
						)}
					</span>
				</div>
				<div>{durationCalced}</div>
			</div>
		</div>
	);
}

export default SongItem;
