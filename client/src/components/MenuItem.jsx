import "./MenuItem.css";
import { Link } from "react-router-dom";
function MenuItem({ Icon, name }) {
	return (
		<Link to={`/${name}`}>
			<div className="flex gap-5 text-sm  items-center py-2 cursor-pointer p-2 menuitem sidebarSpace">
				<Icon /> <span>{name}</span>{" "}
			</div>
		</Link>
	);
}

export default MenuItem;
