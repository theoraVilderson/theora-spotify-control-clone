import { cookieHandler } from "../libs/cookieHandler";

export const initialValue = {
	userInfo: {},
	tokens: {},
	playlists: {},
	paused: false,
	loginUrl: null,
	loginChallange: null,
	activePlayList: null,
	activeMusic: null,
	activeMenu: null,
};

export const actionTypes = {
	SET_TOKENS: "SET_TOKENS",
	SET_USERINFO: "SET_USERINFO",
	SET_PLAYISTS: "SET_PLAYISTS",
	SET_PAUSED: "SET_PAUSED",
	SET_LOGIN_LINK: "SET_LOGIN_LINK",
	SET_LOGIN_CHALLANGE: "SET_LOGIN_CHALLANGE",
	LOG_OUT_USER: "LOG_OUT_USER",
	SET_ACTIVE_PLAYIST: "SET_ACTIVE_PLAYIST",
	SET_ACTIVE_MUSIC: "SET_ACTIVE_MUSIC",
	SET_ACTIVE_MENU: "SET_ACTIVE_MENU",
};

const reducer = (state, { type, payload } = {}) => {
	const {
		SET_TOKENS,
		SET_LOGIN_LINK,
		SET_LOGIN_CHALLANGE,
		SET_USERINFO,
		LOG_OUT_USER,
		SET_PLAYISTS,
		SET_ACTIVE_PLAYIST,
		SET_ACTIVE_MUSIC,
		SET_ACTIVE_MENU,
	} = actionTypes;

	switch (type) {
		case SET_TOKENS:
			return { ...state, tokens: payload };
		case SET_LOGIN_LINK:
			return { ...state, loginUrl: payload };
		case SET_LOGIN_CHALLANGE:
			return { ...state, loginChallange: payload };
		case SET_USERINFO:
			return { ...state, userInfo: payload };
		case SET_PLAYISTS:
			return { ...state, playists: payload };
		case SET_ACTIVE_PLAYIST:
			return { ...state, activePlayList: payload };
		case SET_ACTIVE_MUSIC:
			return { ...state, activeMusic: payload };
		case SET_ACTIVE_MENU:
			return { ...state, activeMenu: payload };
		case LOG_OUT_USER:
			cookieHandler.delete("accessToken");
			cookieHandler.delete("refreshToken");
			// setTimeout(
			// 	() =>
			// 		(window.location.href =
			// 			"https://accounts.spotify.com/en/logout")
			// );

			return { ...state, userInfo: {}, tokens: {} };
		default:
			return state;
	}
};

export default reducer;
