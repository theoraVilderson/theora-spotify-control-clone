import { FaRegHeart } from "@react-icons/all-files/fa/FaRegHeart";
import { FaCrown } from "@react-icons/all-files/fa/FaCrown";
import { FaBell } from "@react-icons/all-files/fa/FaBell";
import { FaCogs } from "@react-icons/all-files/fa/FaCogs";
import { FaSun } from "@react-icons/all-files/fa/FaSun";
import { FaUserAstronaut } from "@react-icons/all-files/fa/FaUserAstronaut";
import { IoMdHeart } from "@react-icons/all-files/io/IoMdHeart";
import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import { useEffect, useState } from "react";
import "./SidebarRight.css";
export function SidebarRightItem({ children }) {
	return (
		<div className="flex flex-col justify-center items-center py-3 gap-1 text-xl cursor-pointer activeColor">
			{children}
		</div>
	);
}

function SidebarRight({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const fetcher = useFetcher();
	const {
		userInfo,
		playerState,
		playerQueue: allPlayerQueue,
		activeMusic,
	} = globalData;

	const playerQueue = allPlayerQueue[feedType];

	// playerQueue[]
	const isFree =
		["free", "open"].includes(userInfo?.product) ||
		userInfo?.product == null;

	const userImage = userInfo?.images?.[0]?.url;

	const activeMusicId = activeMusic?.id;

	const isLiked = !!activeMusic?.isLiked;

	const [like, setLike] = useState(false);
	const [isLiking, setIsLiking] = useState(false);

	useEffect(() => {
		setLike(isLiked);
	}, [isLiked, activeMusicId]);

	const onHitLike = () => {
		if (isLiking || !activeMusicId) return;

		setIsLiking(true);

		fetcher(`/api/track/like/${activeMusicId}`, {
			method: !like ? "PUT" : "DELETE",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}

				dispatch({
					type: actionTypes.SET_ACTIVE_MUSIC,
					payload: {
						...activeMusic,
						isLiked: !like,
					},
				});
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
		<aside className="sidebarRight sticky top-0 justify-between py-5 items-center flex-col min-w-[50px] w-2/5 hidden md:flex  max-w-[100px] md:w-2/12 min-h-[500px] h-screen">
			<div className="flex flex-col justify-center items-center">
				<SidebarRightItem className="flex flex-col justify-center items-center">
					<FaCrown className={`${!isFree ? "selectedColor" : ""}`} />
					{isFree ? <span className="text-xs">Go Pro</span> : null}
				</SidebarRightItem>

				<SidebarRightItem>
					<span className="notification active animate-ping"></span>
					<FaBell />
				</SidebarRightItem>
				{!activeMusicId ? null : (
					<SidebarRightItem>
						<span
							onClick={onHitLike}
							className={` ${isLiking ? "animate-spin" : ""}`}
						>
							{!like ? (
								<FaRegHeart className="selectedColor hover:scale-110" />
							) : (
								<IoMdHeart className="selectedColor hover:scale-90" />
							)}
						</span>
					</SidebarRightItem>
				)}
			</div>
			<div className="flex flex-col justify-center items-center">
				<SidebarRightItem>
					<FaSun />
				</SidebarRightItem>

				<SidebarRightItem>
					<FaCogs />
				</SidebarRightItem>

				<SidebarRightItem>
					{!userImage ? (
						<FaUserAstronaut />
					) : (
						<img src={userImage} alt="userAvatar" />
					)}
				</SidebarRightItem>
			</div>
		</aside>
	);
}

export default SidebarRight;