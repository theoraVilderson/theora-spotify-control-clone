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
import Like from "./Like";
import ContextMenu from "./ContextMenu";
import { AiOutlineDoubleRight } from "@react-icons/all-files/ai/AiOutlineDoubleRight";

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

	const [isSideBarOpen, setIsSideBarOpen] = useState(true);

	const sideBarToggle = () => {
		setIsSideBarOpen(!isSideBarOpen);
	};
	const logout = async () => {
		let res;
		try {
			res = await fetcher("/api/logout");
		} catch (e) {
			return 0;
		}
		if (res.data.error) return 1;

		dispatch({ type: actionTypes.LOG_OUT_USER });
	};
	return (
		<>
			<div
				className={`flex md:hidden bg-blue-300 sticky -ml-[30px]  p-3 text-white z-20 ${
					isSideBarOpen ? "right-[50px] " : "-rotate-180 right-0"
				}  top-1/2 -translate-y-[50%] h-10`}
				onClick={sideBarToggle}
			>
				<AiOutlineDoubleRight />
			</div>
			<aside
				className={`${
					isSideBarOpen ? "!flex  z-[20] activeBgColor" : ""
				} sidebarRight sticky right-0 top-0 justify-between py-5 items-center flex-col min-w-[50px] w-2/5 hidden md:flex  max-w-[100px] md:w-2/12 min-h-[500px] h-screen`}
			>
				<div className="flex flex-col justify-center items-center">
					<SidebarRightItem className="flex flex-col justify-center items-center">
						<FaCrown
							className={`${!isFree ? "selectedColor" : ""}`}
						/>
						{isFree ? (
							<span className="text-xs">Go Pro</span>
						) : null}
					</SidebarRightItem>

					<SidebarRightItem>
						<span className="notification active animate-ping"></span>
						<FaBell />
					</SidebarRightItem>
					{!activeMusicId ? null : (
						<SidebarRightItem>
							<Like item={activeMusic} feedType={feedType} />
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
						<ContextMenu
							style={{ cursor: "context-menu" }}
							type={feedType}
							menuItems={[
								{
									title: "logout",
									active: true,
									type: feedType,
									action: logout,
								},
							]}
							clickable
						>
							{!userImage ? (
								<FaUserAstronaut />
							) : (
								<img
									src={userImage}
									className="w-[40px] h-[40px] border-solid cursor-pointer"
									alt="userAvatar"
								/>
							)}
						</ContextMenu>
					</SidebarRightItem>
				</div>
			</aside>
		</>
	);
}

export default SidebarRight;
