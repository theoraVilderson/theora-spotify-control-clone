import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import { FaRegHeart } from "@react-icons/all-files/fa/FaRegHeart";
import { IoMdHeart } from "@react-icons/all-files/io/IoMdHeart";

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
	} = JSON.parse(songInfo);

	const [globalData, dispatch] = useGlobalContext();
	const { userInfo } = globalData;
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

	return (
		<div className="song flex justify-between cursor-pointer group activeColorHover">
			<div className="flex gap-2 p-3 ">
				<div className="w-10 flex justify-center items-center ">
					#{numberId}
				</div>
				<div className="w-12 h-12 rounded overflow-hidden">
					{backgroundImg && (
						<img
							className="w-12 h-12 group-hover:scale-150 duration-100"
							src={backgroundImg}
							alt="SongImg"
						/>
					)}
				</div>
				<div className="text-xs flex flex-col justify-around">
					<Link
						to={`/track/${id}`}
						className="border-b hover:border-current border-solid border-transparent font-bold activeColor"
					>
						{name}
					</Link>
					<div className="flex ">
						{artists.map((e, k) => {
							return (
								<>
									{(k && ",") || null}

									<Link
										to={`/artist/${e.id}`}
										className={`border-b hover:border-current border-solid border-transparent ${
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
			<div className="flex items-center gap-4 p-5">
				<div className="like">
					<span
						onClick={onHitLike}
						className={`${
							!like && !isLiking
								? "hidden group-hover:inline-block"
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
