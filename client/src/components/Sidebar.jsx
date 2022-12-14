import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import { BsThreeDots } from "@react-icons/all-files/bs/BsThreeDots";
import { BiSearchAlt } from "@react-icons/all-files/bi/BiSearchAlt";

import { BsFillHouseFill } from "@react-icons/all-files/bs/BsFillHouseFill";
import { IoAlbumsOutline } from "@react-icons/all-files/io5/IoAlbumsOutline";
import { BiPulse } from "@react-icons/all-files/bi/BiPulse";
import { FaBroadcastTower } from "@react-icons/all-files/fa/FaBroadcastTower";
import { FaMicrophoneAlt } from "@react-icons/all-files/fa/FaMicrophoneAlt";
import { FaPodcast } from "@react-icons/all-files/fa/FaPodcast";
import { IoMdHeart } from "@react-icons/all-files/io/IoMdHeart";

import { BsFillVolumeUpFill } from "@react-icons/all-files/bs/BsFillVolumeUpFill";
import { BsMusicNoteList } from "@react-icons/all-files/bs/BsMusicNoteList";
import { FaDesktop } from "@react-icons/all-files/fa/FaDesktop";
import { AiOutlineDoubleRight } from "@react-icons/all-files/ai/AiOutlineDoubleRight";

import {
	Link,
	useLocation,
	useNavigate,
	useSearchParams,
} from "react-router-dom";
import "./Sidebar.css";
import MenuItem from "./MenuItem";
import SliderRange from "./SliderRange";
import UserPlayLists from "./UserPlayLists";
import LinkWithBorder from "./LinkWithBorder";

import { useEffect, useState, useMemo } from "react";

import defaultPlayListImg from "../imgs/defaultPlayList.png";

function Sidebar({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, activeMenu, playerState } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);
	const { pathname } = useLocation();
	const isFree =
		["free", "open"].includes(userInfo?.product) ||
		userInfo?.product == null;
	const menuItems = [
		{
			id: 1,
			icon: BsFillHouseFill,
			name: "Home",
		},
		{
			id: 2,
			icon: IoMdHeart,
			name: "Liked Songs",
			link: "LikedSongs",
		},
		{
			id: 3,
			icon: FaMicrophoneAlt,
			name: "Liked Artists",
			link: "LikedArtists",
		},
		{
			id: 4,
			icon: IoAlbumsOutline,
			name: "Liked Albums",
			link: "LikedAlbums",
		},
		{
			id: 5,
			icon: FaPodcast,
			name: "Liked Podcasts",
			link: "LikedPodcasts",
		},
	];
	const activeMenuId = useMemo(() => {
		const path = decodeURIComponent(pathname.slice(1)).toLowerCase().trim();
		const res = menuItems.find(
			(e) => (e.link ?? e.name).toLowerCase() === path
		);

		return res?.id ?? (!path ? 1 : "");
	}, [pathname]);

	useEffect(() => {
		dispatch({ type: actionTypes.SET_ACTIVE_MENU, payload: activeMenuId });
	}, [activeMenuId]);

	const activeMusicItem = playerState?.item;
	const navigate = useNavigate();
	const searchQuery = useSearchParams()[0].get("query");

	const [search, setSearch] = useState(
		feedType === "Search" ? searchQuery : ""
	);
	const [updateOnDefaultChange, setUpdateOnDefaultChange] = useState(true);
	const [updateOnDefaultIsDisabled, setUpdateOnDefaultIsDisabled] =
		useState(false);
	const [range, setRange] = useState(50);
	const seekTo = function () {
		fetcher(`/api/player/volume?volume_percent=${~~range}`, {
			method: "PUT",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				playerState.device.volume_percent = range;

				dispatch({
					type: actionTypes.SET_PLAYER_STATE,
					payload: playerState,
				});
			})
			.catch((e) => {
				console.log(e);
				alert(`sorry couldn't update volume `);
			})
			.finally(() => {
				setUpdateOnDefaultChange(true);
			});
	};
	useEffect(
		(e) => {
			if (!updateOnDefaultIsDisabled) return;
			setUpdateOnDefaultIsDisabled(false);
			seekTo();
		},
		[updateOnDefaultIsDisabled]
	);

	useEffect(() => {
		if (!search) return;

		const timer = setTimeout(() => {
			navigate(`/Search?query=${encodeURIComponent(search)}`);
		}, 500);
		return () => {
			clearTimeout(timer);
		};
	}, [search]);
	const [isSideBarOpen, setIsSideBarOpen] = useState(false);

	const sideBarToggle = () => {
		setIsSideBarOpen(!isSideBarOpen);
	};
	return (
		<>
			<aside
				className={`sidebar sticky top-0 ${
					isSideBarOpen
						? "!flex -ml-[220px] z-[20] activeBgColor"
						: ""
				} flex-col min-w-[200px] w-3/5 md:w-2/5 hidden md:flex  md:min-w-[280px] left-0  max-w-[350px] md:w-1/5 min-h-screen`}
			>
				{/*head */}
				<div className="sidebar__head flex items-center justify-between gap-4 sidebarSpace">
					<Link to="/">
						<svg
							viewBox="0 0 1134 340"
							className="w-28 text-white fill-white max-w-[400px]"
						>
							<path
								fill="white"
								d="M8 171c0 92 76 168 168 168s168-76 168-168S268 4 176 4 8 79 8 171zm230 78c-39-24-89-30-147-17-14 2-16-18-4-20 64-15 118-8 162 19 11 7 0 24-11 18zm17-45c-45-28-114-36-167-20-17 5-23-21-7-25 61-18 136-9 188 23 14 9 0 31-14 22zM80 133c-17 6-28-23-9-30 59-18 159-15 221 22 17 9 1 37-17 27-54-32-144-35-195-19zm379 91c-17 0-33-6-47-20-1 0-1 1-1 1l-16 19c-1 1-1 2 0 3 18 16 40 24 64 24 34 0 55-19 55-47 0-24-15-37-50-46-29-7-34-12-34-22s10-16 23-16 25 5 39 15c0 0 1 1 2 1s1-1 1-1l14-20c1-1 1-1 0-2-16-13-35-20-56-20-31 0-53 19-53 46 0 29 20 38 52 46 28 6 32 12 32 22 0 11-10 17-25 17zm95-77v-13c0-1-1-2-2-2h-26c-1 0-2 1-2 2v147c0 1 1 2 2 2h26c1 0 2-1 2-2v-46c10 11 21 16 36 16 27 0 54-21 54-61s-27-60-54-60c-15 0-26 5-36 17zm30 78c-18 0-31-15-31-35s13-34 31-34 30 14 30 34-12 35-30 35zm68-34c0 34 27 60 62 60s62-27 62-61-26-60-61-60-63 27-63 61zm30-1c0-20 13-34 32-34s33 15 33 35-13 34-32 34-33-15-33-35zm140-58v-29c0-1 0-2-1-2h-26c-1 0-2 1-2 2v29h-13c-1 0-2 1-2 2v22c0 1 1 2 2 2h13v58c0 23 11 35 34 35 9 0 18-2 25-6 1 0 1-1 1-2v-21c0-1 0-2-1-2h-2c-5 3-11 4-16 4-8 0-12-4-12-12v-54h30c1 0 2-1 2-2v-22c0-1-1-2-2-2h-30zm129-3c0-11 4-15 13-15 5 0 10 0 15 2h1s1-1 1-2V93c0-1 0-2-1-2-5-2-12-3-22-3-24 0-36 14-36 39v5h-13c-1 0-2 1-2 2v22c0 1 1 2 2 2h13v89c0 1 1 2 2 2h26c1 0 1-1 1-2v-89h25l37 89c-4 9-8 11-14 11-5 0-10-1-15-4h-1l-1 1-9 19c0 1 0 3 1 3 9 5 17 7 27 7 19 0 30-9 39-33l45-116v-2c0-1-1-1-2-1h-27c-1 0-1 1-1 2l-28 78-30-78c0-1-1-2-2-2h-44v-3zm-83 3c-1 0-2 1-2 2v113c0 1 1 2 2 2h26c1 0 1-1 1-2V134c0-1 0-2-1-2h-26zm-6-33c0 10 9 19 19 19s18-9 18-19-8-18-18-18-19 8-19 18zm245 69c10 0 19-8 19-18s-9-18-19-18-18 8-18 18 8 18 18 18zm0-34c9 0 17 7 17 16s-8 16-17 16-16-7-16-16 7-16 16-16zm4 18c3-1 5-3 5-6 0-4-4-6-8-6h-8v19h4v-6h4l4 6h5zm-3-9c2 0 4 1 4 3s-2 3-4 3h-4v-6h4z"
							></path>
							<title>Spotify</title>
						</svg>
					</Link>

					<BsThreeDots className="w-6 h-6 activeColor cursor-pointer" />
				</div>
				{/*Search */}
				<div
					className=" flex items-center gap-4 py-5 rounded-lg sidebarSpace my-2 pl-[7px] ml-[7px] box-boarder"
					styled={{
						background: "var(--background-base)",
					}}
				>
					<BiSearchAlt className="w-6 h-6" />
					<input
						type="text"
						className="ring-0 outline-0 border-0 bg-transparent w-9/12 activeColor"
						placeholder="Search..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				{/* Menu */}
				<div className="sidebar__menu mb-2">
					<h2 className="sidebarSpace text-xs">MENU</h2>

					{menuItems.map((item) => {
						return (
							<MenuItem
								key={item.id}
								Icon={item.icon}
								name={item.name}
								link={item.link}
								active={item.id === activeMenu}
							/>
						);
					})}
				</div>
				<UserPlayLists feedType={feedType} />

				{/*Player Section 1*/}
				<div className="flex flex-col gap-3 pb-2">
					<div className="flex  items-center sidebarSpace gap-3">
						<img
							src={defaultPlayListImg}
							alt="playLogo"
							className="w-12 h-12"
						/>
						<div className="flex flex-col justify-center ">
							<div className="text-sm activeColor cursor-pointer">
								{feedType}
							</div>
							<span className="text-xs cursor-pointer opacity-50 hover:opacity-100 inline-flex self-start capitalize">
								<LinkWithBorder to={"/user/" + userInfo?.id}>
									{userInfo?.display_name}
								</LinkWithBorder>
							</span>
						</div>
					</div>
					<div
						className={`flex justify-around items-center ${
							!activeMusicItem ? "hidden" : ""
						}`}
					>
						<BsFillVolumeUpFill />

						<SliderRange
							defaultValues={[
								!updateOnDefaultChange
									? range
									: playerState?.device?.volume_percent ?? 50,
							]}
							onSliderChange={([val]) => {
								setRange(val);
							}}
							disabled={isFree}
							step={1}
							min={0}
							max={100}
							onSliderDone={() => {
								// if (isFree) return;
								setUpdateOnDefaultIsDisabled(true);
							}}
							onSliderStart={() => {
								// if (isFree) return;
								setUpdateOnDefaultChange(false);
							}}
							updateOnDefaultChange={updateOnDefaultChange}
						/>

						<BsMusicNoteList className="cursor-pointer" />

						<FaDesktop className="cursor-pointer" />
					</div>
				</div>
			</aside>
			<div
				className={`flex md:hidden bg-orange-300 p-3 text-white sticky z-20 ${
					isSideBarOpen
						? " ml-3/5 translate-x-[230px] sm:translate-x-[50vw] left-3/5 md:left-2/5 rotate-180"
						: "left-0 -ml-5 "
				}  top-1/2 -translate-y-[50%]`}
				onClick={sideBarToggle}
			>
				<AiOutlineDoubleRight />
			</div>
		</>
	);
}

export default Sidebar;
