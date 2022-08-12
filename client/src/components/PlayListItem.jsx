import { Link } from "react-router-dom";
import { BsMusicNoteList } from "@react-icons/all-files/bs/BsMusicNoteList";
import { BsTrash } from "@react-icons/all-files/bs/BsTrash";
import { FaLock } from "@react-icons/all-files/fa/FaLock";
import Follow from "./Follow";

import "./PlayListItem.css";

function PlayListItem({ id, name, active, public: isPublic, item, ...rest }) {
	return (
		<div
			className={`flex gap-3 text-sm sidebarSpace items-center playListItem ${
				active ? "active" : ""
			}`}
		>
			<Link
				to={`/playlist/${id}`}
				className="flex items-center gap-3 flex-1"
			>
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
			</Link>
			<div>
				<Follow
					className=""
					target={item}
					UnFollowContent={<BsTrash />}
					loaderProps={{ width: 20, height: 20 }}
				/>
			</div>
		</div>
	);
}

export default PlayListItem;
