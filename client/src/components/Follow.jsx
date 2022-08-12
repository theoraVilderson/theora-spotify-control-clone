import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";
import { RingCenterdLoader } from "./Loading";

import { useEffect, useState } from "react";

function Follow({
	target,
	FollowContent,
	UnFollowContent,
	loaderProps = {},
	...restProps
}) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playlists } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const type = target?.type;

	const id = target?.id;
	const [isFollowed, setIsFollowed] = useState(target?.isFollowed);
	const [isProcessFollow, setIsProcessFollow] = useState(false);
	const followAction = async () => {
		if (isProcessFollow || !target) return;

		setIsProcessFollow(true);
		const initTurn = () => {
			if (!window.queue) {
				window.queue = {
					nowTurn: "",
					queue: {},
				};
			}
		};
		const isRegisterd = () => {
			return !!window.queue.queue[id];
		};
		const register = () => {
			window.queue.queue[id] = "1";
		};
		const unregister = () => {
			delete window.queue.queue[id];
			if (window.queue.nowTurn === id) {
				window.queue.nowTurn = "";
			}
		};
		initTurn();

		if (isRegisterd()) {
			return unregister();
		} else {
			register();
		}

		const isMyTurn = () => {
			return window.queue.nowTurn === id;
		};

		const setTurn = () => {
			window.queue.nowTurn = id;
		};

		const restQueue = () => {
			const ids = Object.keys(window.queue.queue);
			if (!ids.length) return;
			setTurn(ids[0]);
		};
		setTurn();

		try {
			await new Promise((res, rej) => {
				const action = () => {
					setTimeout(() => {
						if (isMyTurn()) {
							return res();
						} else if (!isRegisterd()) {
							return rej();
						}

						return action();
					}, 100);
				};
				action();
			});
		} catch (e) {
			return;
		}

		fetcher(`/api/${type}/${id}/follow`, {
			method: !isFollowed ? "PUT" : "DELETE",
		})
			.then((e) => {
				if (e.data.error) {
					return;
				}
				setIsFollowed(!isFollowed);
				if (type !== "playlist") return;

				let newData = { at: "end" };

				if (playlists[id] != null && isFollowed === true) {
					newData.data = { [id]: "" };
				} else if (isFollowed === false) {
					if (playlists[id] == null) newData.at = "start";
					newData.data = { [id]: target };
				}
				dispatch({
					type: actionTypes.SET_PLAYLIST,
					payload: newData,
				});
			})
			.catch((e) => {
				console.log(e);
				alert(`sorry couldn't ${isFollowed ? "unFollow" : "follow"}`);
			})
			.finally(() => {
				setIsProcessFollow(false);
				unregister();
				restQueue();
			});
	};

	useEffect(() => {
		setIsFollowed(target?.isFollowed);
	}, [target, target?.isFollowed]);

	useEffect(() => {
		console.log("changed reco", type);
		if (type !== "playlist") return;

		if (playlists[id] == false) {
			setIsFollowed(false);
		}
	}, [playlists]);

	return (
		<button
			className="bg-transparent  w-32 h-12 rounded-full border-2 border-current border-solid flex justify-center items-center gap-2"
			{...restProps}
			onClick={followAction}
		>
			<RingCenterdLoader isLoaded={!isProcessFollow} {...loaderProps} />
			{isProcessFollow
				? null
				: isFollowed
				? UnFollowContent
				: FollowContent}
		</button>
	);
}

export default Follow;
