import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import { FaRegHeart } from "@react-icons/all-files/fa/FaRegHeart";
import { IoMdHeart } from "@react-icons/all-files/io/IoMdHeart";
import { MdExplicit } from "@react-icons/all-files/md/MdExplicit";
import { BsMusicNoteList } from "@react-icons/all-files/bs/BsMusicNoteList";

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import "./SongItem.css";
import Like from "./Like";
import Follow from "./Follow";
import LinkWithBorder from "./LinkWithBorder";
import UserPlayLists from "./UserPlayLists";

import { FaLock } from "@react-icons/all-files/fa/FaLock";
import { FaUnlock } from "@react-icons/all-files/fa/FaUnlock";
import { GoCheck } from "@react-icons/all-files/go/GoCheck";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

import { styled } from "@mui/material/styles";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";

const HtmlTooltip = styled(({ className, ...props } = {}) => (
	<Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
	[`& .${tooltipClasses.tooltip}`]: {
		backgroundColor: "#000",
		maxWidth: "250px",
		minWidth: "100px",
		width: "30vw",
		fontSize: theme.typography.pxToRem(12),
	},
}));

function SongItem({ songInfo, numberId, feedType, action = true }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, activeMusic, playerQueue } = globalData;
	const [songData, setSongData] = useState(songInfo);
	const { name, artists, id, duration_ms, isLiked, explicit } = songData;
	useEffect(() => {
		if (activeMusic?.id === id) {
			setSongData(activeMusic);
		}
	}, [songInfo, activeMusic]);

	useEffect(() => {
		setSongData(songInfo);
	}, [songInfo]);
	const fetcher = useFetcher([globalData, dispatch]);

	const images = songInfo?.album?.images ?? songInfo?.images;

	const isPlaylistType = songData.type == "playlist";
	const isFollowable = songData.isFollowed != null;

	const backgroundImg = useMemo(() => {
		const targetImage = images?.reduce?.((e, n) => {
			e.width = e.width ?? 0;
			e.height = e.height ?? 0;
			return e.width + e.height <= n.width + n.height ? n : e;
		}, {});
		return targetImage?.url;
	}, [images]);

	const [like, setLike] = useState(isLiked);
	const [isLiking, setIsLiking] = useState(false);

	useEffect(() => {
		setLike(isLiked);
	}, [isLiked, activeMusic]);

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

		fetcher(`/api/${songInfo.type}/like/${id}`, {
			method: !like ? "PUT" : "DELETE",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				setLike(!like);

				dispatch({
					type: actionTypes.SET_ACTIVE_MUSIC,
					payload: {
						...activeMusic,
						isLiked: !like,
					},
				});
			})
			.catch((e) => {
				console.log(e);
				alert(`sorry couldn't ${like ? "unLike" : "like"}`);
			})
			.finally(() => {
				setIsLiking(false);
			});
	};
	const isActiveSong = id === activeMusic?.id;
	const [isReuqstingToSongPlay, setIsReuqstingToSongPlay] = useState(false);

	const onSelectSong = () => {
		if (isActiveSong || isReuqstingToSongPlay) return;

		const uri = `spotify:${songData.type}:${id}`;

		const uriType = ["track", "episode"].includes(songData.type)
			? "uris"
			: "context_uri";

		setIsReuqstingToSongPlay(true);

		fetcher(`/api/player/play/?${uriType}=${uri}`, {
			method: "PUT",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
			})
			.catch((e) => {
				console.log(e);
				alert(`sorry couldn't play the ${name}`);
			})
			.finally(() => {
				setIsReuqstingToSongPlay(false);
			});
	};

	const [contextMenu, setContextMenu] = useState(null);

	const handleContextMenu = (event) => {
		event.preventDefault();
		setContextMenu(
			contextMenu === null
				? {
						mouseX: event.clientX + 2,
						mouseY: event.clientY - 6,
				  }
				: // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
				  // Other native context menus might behave different.
				  // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
				  null
		);
	};

	const handleCloseContextMenu = (action = async () => {}) => {
		return async (...args) => {
			typeof action === "function" && (await action(...args));
			setContextMenu(null);
		};
	};
	const copyText = (value) => {
		const copyToClipboardWithElm = (val) => {
			const textField = document.createElement("textarea");
			textField.innerText = val;
			document.body.appendChild(textField);
			textField.select();
			document.execCommand("copy");
			textField.remove();
			return true;
		};
		const copyToClipboardWithNavigator = (val) =>
			navigator.clipboard.writeText(val);

		return window.navigator
			? copyToClipboardWithNavigator(value)
			: copyToClipboardWithElm(value);
	};
	const copyTargetlink = () => {
		const pathURL = `${songData.type}/${songData.id}`;
		const currentOrigin = window.location.origin;
		const linkURL = currentOrigin + "/" + pathURL;

		return copyText(linkURL);
	};
	const playlistActions = (
		{ itemSelected, playlistSelected },
		create = true
	) => {
		const uri = encodeURIComponent(
			`spotify:${itemSelected.type}:${itemSelected.id}`
		);

		return fetcher(
			`/api/playlist/${playlistSelected.id}/tracks?uris=${uri}`,
			{
				method: create ? "post" : "delete",
			}
		)
			.then((e) => {
				if (e.data.error) {
					alert(`track has ${create ? "added" : "deleted"} on Error`);
					return;
				}
				alert(`track has ${create ? "added" : "deleted"} on success`);
			})
			.catch((e) => {
				alert(`track has ${create ? "added" : "deleted"} on Error`);
			});
	};
	const addToPlaylist = (...args) => {
		playlistActions(...args);
	};

	const removeToPlaylist = (...args) => {
		const playlist = playerQueue[feedType] ?? {};

		playlistActions(
			{ itemSelected: songData, playlistSelected: playlist },
			false
		).then((e) => {
			playlist.playlistItems.items[songData.id] = "";

			dispatch({
				type: actionTypes.SET_PLAYER_QUEUE,
				payload: {
					name: feedType,
					data: playlist,
				},
			});
		});
	};

	return (
		<div
			className={`song  flex flex-col sm:flex-row justify-between cursor-pointer group ${
				isActiveSong ? "selectedColor" : "activeColorHover"
			} `}
			onDoubleClick={onSelectSong}
			onContextMenu={handleContextMenu}
			style={{ cursor: "context-menu" }}
		>
			<Menu
				open={contextMenu !== null}
				onClose={handleCloseContextMenu()}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu !== null
						? { top: contextMenu.mouseY, left: contextMenu.mouseX }
						: undefined
				}
				sx={{
					"& ul,& li": {
						color: "var(--text-base)",
						backgroundColor: "var(--background-base)",
					},
					"& ul": {
						padding: "0",
					},
					"& li:hover": {
						backgroundColor: "rgba(255,255,255,.3)",
					},
				}}
			>
				<MenuItem
					onClick={handleCloseContextMenu(copyTargetlink)}
					className="activeColor activeBgColor"
				>
					Copy
				</MenuItem>
				{["episode", "track"].includes(songData.type) ? (
					<MenuItem
						disableRipple
						className="activeColor activeBgColor w-[200px] h-8 !p-0 !px-3  "
					>
						{feedType !== "Playlist" ? (
							<HtmlTooltip
								placement="right"
								className="activeColor activeBgColor"
								title={
									<>
										<UserPlayLists
											feedType={feedType}
											addToPlaylistItem={songData}
											onPlaylistContext={handleCloseContextMenu(
												addToPlaylist
											)}
										/>
									</>
								}
							>
								<button className="flex w-full h-full items-center ">
									Add To PlayList >
								</button>
							</HtmlTooltip>
						) : (
							<button
								className="flex w-full h-full items-center "
								onClick={handleCloseContextMenu(() =>
									removeToPlaylist()
								)}
							>
								Delete From PlayList
							</button>
						)}
					</MenuItem>
				) : null}
			</Menu>
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
							to={`/${songInfo.type}/${id}`}
							className="border-b break-all hover:border-current border-solid border-transparent font-bold activeColor"
						>
							{name}
						</Link>
					</div>
					<div className="flex flex-wrap items-center">
						{explicit ? (
							<MdExplicit className="w-4 h-4 m-2 ml-0" />
						) : null}
						{artists?.map?.((e, k) => {
							return (
								<span key={k}>
									{(k && ",") || null}

									<LinkWithBorder
										to={`/artist/${e.id}`}
										isNeedSpace={!!k}
									>
										{e.name}
									</LinkWithBorder>
								</span>
							);
						})}
						{!songInfo.show ? null : (
							<span key={songInfo.show.id}>
								<Link
									to={`/show/${songInfo.show.id}`}
									className={`border-b break-all hover:border-current border-solid border-transparent  `}
								>
									{songInfo.show.name}
								</Link>
							</span>
						)}
						{songInfo.type !==
						"episode" ? null : !songInfo?.description?.trim?.() ? (
							<span>{songInfo.release_date}</span>
						) : (
							<span key={songInfo.id}>
								{songInfo.description}
							</span>
						)}
						{songInfo.type !==
						"playlist" ? null : !songInfo?.description?.trim?.() ? null : (
							<span key={songInfo.id}>
								{songInfo.description}
							</span>
						)}
					</div>
				</div>
			</div>
			<div className="flex w-full sm:w-auto justify-between sm:justify-scratch items-center gap-4 p-5">
				{!action ? null : (
					<>
						{isFollowable ? (
							<Follow
								target={songData}
								FollowContent={<>Follow</>}
								UnFollowContent={
									<>
										<GoCheck
											className="w-4 h-4 float-left"
											style={{
												color: "var(--text-base)",
											}}
										/>
										Following
									</>
								}
							/>
						) : (
							<Like item={songData} feedType={feedType} hover />
						)}
					</>
				)}

				<div>
					{songData?.total_tracks ? (
						<div className="flex items-center gap-1">
							{" "}
							<BsMusicNoteList />
							<div className="min-w-[30px] text-center">
								{songData?.total_tracks}
							</div>
						</div>
					) : isPlaylistType ? (
						<div>{songData.public ? <FaUnlock /> : <FaLock />}</div>
					) : duration_ms ? (
						durationCalced
					) : (
						""
					)}
				</div>
			</div>
		</div>
	);
}

export default SongItem;
