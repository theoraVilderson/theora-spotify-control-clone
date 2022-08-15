import { useEffect, useState, useMemo, useReducer } from "react";
import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";

import useFetcher from "../hooks/fetcher";

import { BsMusicNoteList } from "@react-icons/all-files/bs/BsMusicNoteList";
import { BsTrash } from "@react-icons/all-files/bs/BsTrash";
import { FaLock } from "@react-icons/all-files/fa/FaLock";
import { BiEdit } from "@react-icons/all-files/bi/BiEdit";
import { Link } from "react-router-dom";

import Follow from "./Follow";
import PlaylistPopup from "./PlaylistPopup";

import "./PlayListItem.css";

function PlayListItem({
	id,
	name,
	active,
	public: isPublic,
	item,
	userId,
	total,
	onSuccess,
	addToPlaylistItem,
	onPlaylistContext,
	...rest
}) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playlists, activePlayList, playerQueue } = globalData;

	const fetcher = useFetcher([globalData, dispatch]);
	const [createPlaylistDialogOpen, setCreatePlaylistDialogOpen] =
		useState(false);

	const playlistClickHandler = () => {
		onPlaylistContext({
			itemSelected: addToPlaylistItem,
			playlistSelected: item,
		});
	};
	const TargetTag = ({ children }) =>
		!addToPlaylistItem ? (
			<Link
				to={`/playlist/${id}`}
				className="flex items-center gap-3 flex-1"
			>
				{children}
			</Link>
		) : (
			<div
				className="flex items-center gap-3 flex-1 cursor-pointer"
				onClick={playlistClickHandler}
			>
				{children}
			</div>
		);
	return (
		<div
			className={`flex gap-3 text-sm sidebarSpace items-center playListItem ${
				active ? "active" : ""
			}`}
		>
			<TargetTag>
				<div>
					<BsMusicNoteList />
				</div>

				<div className="flex-1 flex gap-2 ">
					{isPublic ? null : (
						<div>
							<FaLock />
						</div>
					)}
					<div>{name}</div>
				</div>
			</TargetTag>
			{addToPlaylistItem ? null : (
				<>
					{item.owner.id === userId || item.collaborative ? (
						<div className="flex justify-center items-center cursor-pointer">
							<BiEdit
								onClick={() => {
									setCreatePlaylistDialogOpen(true);
								}}
							/>
						</div>
					) : null}
					{total !== "" && createPlaylistDialogOpen ? (
						<PlaylistPopup
							open={createPlaylistDialogOpen}
							total={total}
							onChange={setCreatePlaylistDialogOpen}
							onSuccess={onSuccess}
							playlist={item}
						/>
					) : null}
					<div className="flex justify-center items-center">
						<Follow
							className="" // the class need to be empty !
							target={item}
							UnFollowContent={<BsTrash />}
							loaderProps={{ width: 20, height: 20 }}
						/>
					</div>
				</>
			)}
		</div>
	);
}

export default PlayListItem;
