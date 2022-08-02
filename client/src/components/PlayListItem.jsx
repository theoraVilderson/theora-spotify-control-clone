import { Link } from "react-router-dom";
import { BsMusicNoteList } from "@react-icons/all-files/bs/BsMusicNoteList";
import { BsTrash } from "@react-icons/all-files/bs/BsTrash";

import "./PlayListItem.css";
function PlayListItem({ id, name, active }) {
	return (
		<Link to={`/playlist/${id}`}>
			<div
				className={`flex gap-3 text-sm sidebarSpace items-center playListItem ${
					active ? "active" : ""
				}`}
			>
				<div>
					<BsMusicNoteList />
				</div>
				<div className="flex-1">{name}</div>
				<div>
					<BsTrash />
				</div>
			</div>
		</Link>
	);
}

export default PlayListItem;
