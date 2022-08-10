import "./MenuItem.css";
import { Link } from "react-router-dom";
function MenuItem({ Icon, name, active, link }) {
	return (
		<Link to={`/${link ?? name}`}>
			<div
				className={`flex gap-5 text-sm  items-center py-2 cursor-pointer p-2 menuitem sidebarSpace ${
					active ? "active" : ""
				}`}
			>
				<Icon /> <span>{name}</span>{" "}
			</div>
		</Link>
	);
}

export default MenuItem;
