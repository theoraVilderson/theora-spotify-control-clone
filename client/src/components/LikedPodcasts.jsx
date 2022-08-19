import LikedTarget from "./LikedTarget";
function LikedPodcasts({ feedType }) {
	return (
		<LikedTarget
			feedType={feedType}
			target="LikedPodcasts"
			targetType="episode"
			contextType="yourepisodes"
		/>
	);
}
export default LikedPodcasts;
