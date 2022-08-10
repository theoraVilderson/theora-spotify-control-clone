import LikedTarget from "./LikedTarget";
function LikedAlbums({ feedType }) {
	return (
		<LikedTarget
			feedType={feedType}
			target="LikedAlbums"
			targetType="album"
		/>
	);
}
export default LikedAlbums;
