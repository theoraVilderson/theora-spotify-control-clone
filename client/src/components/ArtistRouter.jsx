import { useParams } from "react-router-dom";

import Artist from "./Artist";

function ArtistRouter({ feedType }) {
	let { subMenuName = "top-songs" } = useParams();

	subMenuName = subMenuName ? subMenuName.toLowerCase() : subMenuName;
	const allValidSub = ["top-songs", "albums"];
	const defaultMenu = "top-songs";
	subMenuName = allValidSub.includes(subMenuName) ? subMenuName : defaultMenu;

	return <Artist feedType={feedType} route={subMenuName} />;
}
export default ArtistRouter;
