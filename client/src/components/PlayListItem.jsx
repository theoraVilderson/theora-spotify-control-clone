import { Link } from "react-router-dom";
import { BsMusicNoteList } from "@react-icons/all-files/bs/BsMusicNoteList";
import { BsTrash } from "@react-icons/all-files/bs/BsTrash";
import { FaLock } from "@react-icons/all-files/fa/FaLock";

import "./PlayListItem.css";
function PlayListItem({ id, name, active, public: isPublic, ...rest }) {
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

				<div className="flex-1 flex gap-2">
					{isPublic ? null : (
						<div>
							<FaLock />
						</div>
					)}
					<div>{name}</div>
				</div>
				<div>
					<BsTrash />
				</div>
			</div>
		</Link>
	);
}

export default PlayListItem;
