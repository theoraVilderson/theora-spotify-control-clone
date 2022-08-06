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
	playerState: {},
	playerQueue: {},
};

export const actionTypes = {
	SET_TOKENS: "SET_TOKENS",
	SET_USERINFO: "SET_USERINFO",
	SET_PLAYLISTS: "SET_PLAYLISTS",
	SET_PAUSED: "SET_PAUSED",
	SET_LOGIN_LINK: "SET_LOGIN_LINK",
	SET_LOGIN_CHALLANGE: "SET_LOGIN_CHALLANGE",
	LOG_OUT_USER: "LOG_OUT_USER",
	SET_ACTIVE_PLAYIST: "SET_ACTIVE_PLAYIST",
	SET_ACTIVE_MUSIC: "SET_ACTIVE_MUSIC",
	SET_ACTIVE_MENU: "SET_ACTIVE_MENU",
	SET_PLAYER_STATE: "SET_PLAYER_STATE",
	SET_PLAYER_QUEUE: "SET_PLAYER_QUEUE",
};

const reducer = (state, { type, payload } = {}) => {
	const {
		SET_TOKENS,
		SET_LOGIN_LINK,
		SET_LOGIN_CHALLANGE,
		SET_USERINFO,
		LOG_OUT_USER,
		SET_PLAYLISTS,
		SET_ACTIVE_PLAYIST,
		SET_ACTIVE_MUSIC,
		SET_ACTIVE_MENU,
		SET_PLAYER_STATE,
		SET_PLAYER_QUEUE,
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
		case SET_PLAYLISTS:
			return { ...state, playlists: payload };
		case SET_ACTIVE_PLAYIST:
			return { ...state, activePlayList: payload };
		case SET_ACTIVE_MUSIC:
			return { ...state, activeMusic: payload };
		case SET_ACTIVE_MENU:
			return { ...state, activeMenu: payload };
		case SET_PLAYER_STATE:
			return { ...state, playerState: payload };
		case SET_PLAYER_QUEUE:
			return {
				...state,
				playerQueue: {
					...state.playerQueue,
					[payload.name]: payload.data,
				},
			};

		case LOG_OUT_USER:
			cookieHandler.delete("accessToken");
			cookieHandler.delete("refreshToken");
			return { ...state, userInfo: {}, tokens: {} };
		default:
			return state;
	}
};

export default reducer;
