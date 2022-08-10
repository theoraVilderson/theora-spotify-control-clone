import LikedTarget from "./LikedTarget";
function LikedArtists({ feedType }) {
	return (
		<LikedTarget
			feedType={feedType}
			target="LikedArtists"
			targetType="artist"
		/>
	);
}
export default LikedArtists;
