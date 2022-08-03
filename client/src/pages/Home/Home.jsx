import { useState, useEffect } from "react";
import { useGlobalContext } from "../../context/globalContext";
import { actionTypes } from "../../reducer/globalReducer";
import Loading from "../../components/Loading";
import Sidebar from "../../components/Sidebar";
import Feed from "../../components/Feed";

import "./Home.css";
import backgroundImg from "../../imgs/background.jpg";
import useFetcher from "../../hooks/fetcher";

function Home({ feedType }) {
	const [globalData, dispatch] = useGlobalContext();

	const { userInfo } = globalData;

	const fetcher = useFetcher([globalData, dispatch]);

	useEffect(() => {
		(async () => {
			let res;
			try {
				res = await fetcher("/api/user");
			} catch (e) {
				return null;
			}
			// console.log(res?.data?.result);
			dispatch({
				type: actionTypes.SET_USERINFO,
				payload: res?.data?.result,
			});
		})();
	}, []);

	return (
		<div className="home page relative">
			<div className="page__container">
				<div className="flex">
					<Sidebar />
					<Feed feedType={feedType} />
				</div>
			</div>
			<div
				className="top-0 left-0 w-full h-full absolute -z-[1]"
				style={{
					background: `url(${backgroundImg}) no-repeat 50%`,
					backgroundSize: "cover",
					filter: "grayscale(100)",
				}}
			></div>
		</div>
	);
}

export default Home;
