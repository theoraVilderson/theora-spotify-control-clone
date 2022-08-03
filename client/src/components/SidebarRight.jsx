import { FaRegHeart } from "@react-icons/all-files/fa/FaRegHeart";
import { FaCrown } from "@react-icons/all-files/fa/FaCrown";
import { FaBell } from "@react-icons/all-files/fa/FaBell";
import { FaCogs } from "@react-icons/all-files/fa/FaCogs";
import { FaSun } from "@react-icons/all-files/fa/FaSun";
import { FaUserAstronaut } from "@react-icons/all-files/fa/FaUserAstronaut";
import { useGlobalContext } from "../context/globalContext";
import useFetcher from "../hooks/fetcher";

import "./SidebarRight.css";
export function SidebarRightItem({ children }) {
	return (
		<div className="flex flex-col justify-center items-center py-3 gap-1 text-xl cursor-pointer activeColor">
			{children}
		</div>
	);
}

function SidebarRight() {
	const [globalData, dispatch] = useGlobalContext();
	const fetcher = useFetcher();
	const { userInfo } = globalData;

	const userImage = userInfo?.images?.[0]?.href;

	return (
		<aside className="sidebarRight justify-between py-5 items-center flex-col min-w-[50px] w-2/5 hidden md:flex  max-w-[100px] md:w-2/12 min-h-[500px] h-screen">
			<div className="flex flex-col justify-center items-center">
				<SidebarRightItem className="flex flex-col justify-center items-center">
					<FaCrown />
					<span className="text-xs">Go Pro</span>
				</SidebarRightItem>

				<SidebarRightItem>
					<span className="notification active"></span>
					<FaBell />
				</SidebarRightItem>
				<SidebarRightItem>
					<FaRegHeart />
				</SidebarRightItem>
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
