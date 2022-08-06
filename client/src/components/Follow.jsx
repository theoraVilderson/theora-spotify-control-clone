import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import { RingCenterdLoader } from "./Loading";

import { useEffect, useState } from "react";

function Follow({ target, FollowContent, UnFollowContent, ...restProps }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const type = target?.type;

	const id = target?.id;

	const [isFollowed, setIsFollowed] = useState(target?.isFollowed);
	const [isProcessFollow, setIsProcessFollow] = useState(false);
	const followAction = () => {
		if (isProcessFollow || !target) return;
		setIsProcessFollow(true);

		fetcher(`/api/${type}/follow/${id}`, {
			method: !isFollowed ? "PUT" : "DELETE",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				setIsFollowed(!isFollowed);
			})
			.catch((e) => {
				console.log(e);
				alert(`sorry couldn't ${isFollowed ? "unFollow" : "follow"}`);
			})
			.finally(() => {
				setIsProcessFollow(false);
			});
	};

	useEffect(() => {
		setIsFollowed(target?.isFollowed);
	}, [target?.isFollowed]);

	return (
		<button
			className="bg-transparent  w-32 h-12 rounded-full border-2 border-current border-solid flex justify-center items-center gap-2"
			{...restProps}
			onClick={followAction}
		>
			<RingCenterdLoader isLoaded={!isProcessFollow} />
			{isProcessFollow
				? null
				: isFollowed
				? UnFollowContent
				: FollowContent}
		</button>
	);
}

export default Follow;
