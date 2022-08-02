import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";
import useFetcher from "../hooks/fetcher";

function Header() {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo } = globalData;
	const fetcher = useFetcher([globalData, dispatch]);

	const logout = async () => {
		let res;
		try {
			res = await fetcher("/api/logout");
		} catch (e) {
			return 0;
		}
		if (res.data.error) return 1;

		dispatch({ type: actionTypes.LOG_OUT_USER });
	};
	return (
		<div className="flex justify-around">
			<div>Hello {userInfo?.display_name}</div>

			<button onClick={logout}>LogOut</button>
		</div>
	);
}

export default Header;
