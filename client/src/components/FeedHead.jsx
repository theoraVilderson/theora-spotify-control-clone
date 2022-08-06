import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import { BsThreeDots } from "@react-icons/all-files/bs/BsThreeDots";

function FeedHead({ feedType = "Suggestion", backgroundImg, children }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

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
					<BsThreeDots className="activeColorHover cursor-pointer" />
				</div>
				<div className="flex lg:justify-between gap-2 lg:items-center flex-col lg:flex-row">
					{children}
				</div>
			</div>
		</div>
	);
}

export default FeedHead;
