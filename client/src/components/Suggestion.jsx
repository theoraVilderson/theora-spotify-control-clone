import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

import { useEffect, useState, useMemo } from "react";
import { BsThreeDots } from "@react-icons/all-files/bs/BsThreeDots";
import { RiUserFollowLine } from "@react-icons/all-files/ri/RiUserFollowLine";
import { GoCheck } from "@react-icons/all-files/go/GoCheck";
import { RingLoader } from "./Loading";
import SongItem from "./SongItem";

function Suggestion({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const [suggestions, setSuggestions] = useState({});
	const backgroundImg = useMemo(() => {
		const targetImage = suggestions?.targetArtist?.images?.reduce?.(
			(e, n) => {
				return e.width + e.height <= n.width + n.height ? n : e;
			}
		);
		return targetImage?.url;
	}, [suggestions]);
	const [isFollowed, setIsFollowed] = useState(false);
	useEffect(() => {
		fetcher("/api/suggestions")
			.then((e) => {
				if (e.data.error) {
					return;
				}
				console.log(e.data.result);
				setSuggestions(e.data.result);
				setIsFollowed(e.data.result?.targetArtist?.isFollowed);
			})
			.catch((e) => {
				console.log(e);
				alert("sorry couldn't get Seggestions");
			});
	}, []);

	const [isProcessFollow, setIsProcessFollow] = useState(false);

	const onHitFollow = () => {
		if (isProcessFollow || !suggestions?.targetArtist) return 1;
		setIsProcessFollow(true);

		const aristId = suggestions?.targetArtist.id;
		fetcher(`/api/artist/follow/${aristId}`, {
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
	return (
		<div className="suggestions">
			<div
				className="suggestions__top h-[40vh] min-h-[340px] bg-no-repeat "
				style={
					backgroundImg && {
						backgroundImage: `url(${backgroundImg})`,
						backgroundAttachment: "fixed",
						backgroundPosition: "50% 50%",
						backgroundSize: "cover",
						contain: "strict",
						contentVisibility: "auto",
					}
				}
			>
				<div className="w-full h-full bg-[rgba(0,0,0,0.5)] p-4 flex flex-col justify-between">
					<div className="flex justify-between">
						<div className="breadCrump">
							Home /{" "}
							<span className="activeColor">{feedType}</span>
						</div>
						<BsThreeDots className="activeColorHover cursor-pointer" />
					</div>
					<div className="flex lg:justify-between gap-2 lg:items-center flex-col lg:flex-row">
						<div className="flex flex-col gap-2">
							<h1
								title={suggestions?.targetArtist?.name}
								className="text-5xl font-bold activeColor max-w-[350px] truncate"
							>
								{suggestions?.targetArtist?.name}
							</h1>
							<div className="flex gap-2 items-center">
								<RiUserFollowLine className="activeColor" />
								<span className="activeColor">
									{suggestions?.targetArtist?.followers?.total?.toLocaleString()}
								</span>
								Fallowers{" "}
							</div>
						</div>
						<div className="flex gap-5 self-end lg:self-auto">
							<button
								className=" w-20 h-12 activeColor rounded-full"
								style={{
									backgroundColor:
										"var(--text-bright-accent)",
								}}
							>
								Play
							</button>
							<button
								onClick={onHitFollow}
								className="bg-transparent  w-32 h-12 rounded-full border-2 border-current border-solid flex justify-center items-center gap-2"
							>
								{isProcessFollow ? (
									<RingLoader
										className=""
										color={window
											.getComputedStyle(
												document.documentElement
											)
											.getPropertyValue("--text-base")}
										width="20px"
										height="20px"
									/>
								) : (
									<>
										{isFollowed ? (
											<GoCheck
												className="w-4 h-4 float-left"
												style={{
													color: "var(--text-base)",
												}}
											/>
										) : null}
										{!isFollowed ? "Follow" : "Following"}
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
			<div className="suggestions__songs flex flex-col">
				{suggestions?.tracks?.map?.((e, k) => {
					return (
						<SongItem
							key={e.id}
							numberId={k + 1}
							songInfo={JSON.stringify(e)}
						/>
					);
				})}
			</div>
		</div>
	);
}

export default Suggestion;
