import LikedTarget from "./LikedTarget";
function LikedSongs({ feedType }) {
	return (
		<LikedTarget
			feedType={feedType}
			target="LikedSongs"
			targetType="track"
			contextType="collection"
		/>
	);
}
export default LikedSongs;
