import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import { FaRegHeart } from "@react-icons/all-files/fa/FaRegHeart";
import { IoMdHeart } from "@react-icons/all-files/io/IoMdHeart";
import { useState, useEffect, useMemo } from "react";

function Like({ item, feedType, hover = false }) {
	const [globalData, dispatch] = useGlobalContext();
	const fetcher = useFetcher();
	const {
		userInfo,
		playerState,
		playerQueue: allPlayerQueue,
		activeMusic,
	} = globalData;

	const playerQueue = allPlayerQueue[feedType] ?? {};

	const [like, setLike] = useState(item.isLiked);
	const [isLiking, setIsLiking] = useState(false);

	useEffect(() => {
		setLike(item.isLiked);
	}, [item]);

	const onHitLike = () => {
		if (isLiking || !item?.id) return;

		setIsLiking(true);

		fetcher(`/api/${item.type}/${item.id}/like`, {
			method: !like ? "PUT" : "DELETE",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				setLike(!like);

				if (item.id == activeMusic.id)
					dispatch({
						type: actionTypes.SET_ACTIVE_MUSIC,
						payload: {
							...activeMusic,
							isLiked: !like,
						},
					});
				if (playerQueue[item.id]) {
					playerQueue[item.id] = {
						...playerQueue[item.id],
						isLiked: !like,
					};

					dispatch({
						type: actionTypes.SET_PLAYER_QUEUE,
						payload: {
							name: feedType,
							data: playerQueue,
						},
					});
				}
			})
			.catch((e) => {
				console.log(e);
				alert(`sorry couldn't ${like ? "unLike" : "like"}`);
			})
			.finally(() => {
				setIsLiking(false);
			});
	};

	useEffect(() => {
		if (activeMusic && activeMusic.id === item.id)
			setLike(activeMusic.isLiked);
	}, [activeMusic]);
	return (
		<div className="like group">
			<span
				onClick={onHitLike}
				className={`${
					!like && !isLiking
						? hover
							? "inline-block sm:hidden group-hover:inline-block"
							: "inline-block"
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
	);
}
export default Like;
