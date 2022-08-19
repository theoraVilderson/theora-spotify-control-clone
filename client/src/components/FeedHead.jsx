import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import { BsThreeDots } from "@react-icons/all-files/bs/BsThreeDots";
import ContextMenu from "./ContextMenu";
import UserPlayLists from "./UserPlayLists";

// import useFetcher from "../hooks/fetcher";
// const { userInfo, playlists, activePlayList, playerQueue } = globalData;

// const fetcher = useFetcher([globalData, dispatch]);
export const copyText = (value) => {
	const copyToClipboardWithElm = (val) => {
		const textField = document.createElement("textarea");
		textField.innerText = val;
		document.body.appendChild(textField);
		textField.select();
		document.execCommand("copy");
		textField.remove();
		return true;
	};
	const copyToClipboardWithNavigator = (val) =>
		navigator.clipboard.writeText(val);

	return window.navigator
		? copyToClipboardWithNavigator(value)
		: copyToClipboardWithElm(value);
};
const copyTargetlink = () => {
	return copyText(window.location.origin + window.location.pathname);
};

function FeedHead({ feedType = "Suggestion", backgroundImg, children }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playerQueue: allPlayerQueue, activeMusic } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const activeFeed = allPlayerQueue[feedType] ?? {};
	const isActiveFeedLoaded = Object.keys(activeFeed).length && activeFeed.id;
	const playlistActions = (
		{ itemSelected, playlistSelected },
		create = true
	) => {
		const uri = encodeURIComponent(
			`spotify:${itemSelected.type}:${itemSelected.id}`
		);

		return fetcher(
			`/api/playlist/${playlistSelected.id}/tracks?uris=${uri}`,
			{
				method: create ? "post" : "delete",
			}
		)
			.then((e) => {
				if (e.data.error) {
					alert(`track has ${create ? "added" : "deleted"} on Error`);
					return;
				}
				alert(`track has ${create ? "added" : "deleted"} on success`);
			})
			.catch((e) => {
				alert(`track has ${create ? "added" : "deleted"} on Error`);
			});
	};
	return (
		<div
			className="feed__head h-[40vh] min-h-[340px] bg-no-repeat bg-contain bg-center "
			style={
				backgroundImg && {
					backgroundImage: `url(${backgroundImg})`,
				}
			}
		>
			<div className="w-full h-full bg-[rgba(0,0,0,0.5)] p-4 flex flex-col justify-between">
				<div className="flex justify-between">
					<div className="breadCrump">
						Home / <span className="activeColor">{feedType}</span>
					</div>

					<ContextMenu
						className={``}
						style={{ cursor: "context-menu" }}
						type={feedType}
						clickable
						menuItems={[
							{
								title: "copy",
								active: true,
								type: feedType,
								action: copyTargetlink,
							},
							,
							{
								title: "Add To PlayList >",
								active: isActiveFeedLoaded,
								type: ["Track", "Episode"],
								actionType:
									feedType !== "Playlist" ? "submenu" : null,
								submenu:
									feedType !== "Playlist"
										? (handleCloseContextMenu) => (
												<UserPlayLists
													feedType={feedType}
													addToPlaylistItem={
														activeFeed
													}
													onPlaylistContext={handleCloseContextMenu(
														(...args) => {
															playlistActions(
																...args
															);
														}
													)}
												/>
										  )
										: null,
							},
						]}
					>
						<BsThreeDots className="activeColorHover cursor-pointer" />
					</ContextMenu>
				</div>
				<div className="flex lg:justify-between gap-2 lg:items-center flex-col lg:flex-row flex-wrap">
					{children}
				</div>
			</div>
		</div>
	);
}

export default FeedHead;
