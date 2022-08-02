const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const querystring = require("querystring");
class SpotifyApi {
	constructor({
		client_id,
		client_secret,
		scops = [],
		exclodeScops = [],
	} = {}) {
		this.client_secret = client_secret;
		this.client_id = client_id;
		this.apiKey = Buffer.from(
			this.client_id + ":" + this.client_secret
		).toString("base64");

		this.apiReq = axios.create({
			headers: {
				Authorization: `Basic ${this.apiKey}`,
			},
		});

		this.allScops = [
			"ugc-image-upload",
			"user-modify-playback-state",
			"user-read-playback-state",
			"user-read-currently-playing",
			"user-follow-modify",
			"user-follow-read",
			"user-read-recently-played",
			"user-read-playback-position",
			"user-top-read",
			"playlist-read-collaborative",
			"playlist-modify-public",
			"playlist-read-private",
			"playlist-modify-private",
			"app-remote-control",
			"streaming",
			"user-read-email",
			"user-read-private",
			"user-library-modify",
			"user-library-read",
		];
		scops = scops && Array.isArray(scops) ? scops : [];
		exclodeScops =
			exclodeScops && Array.isArray(exclodeScops) ? exclodeScops : [];

		this.scops = scops.length
			? scops.filter((e) => this.allScops.includes(e))
			: exclodeScops.length
			? exclodeScops.filter((e) => !this.allScops.includes(e))
			: this.allScops;
	}
	setToken(accessToken) {
		this.accessToken = accessToken;
		this.userReq = axios.create({
			baseURL: "https://api.spotify.com/v1/",
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});
	}
	handleGlobalErrors(e) {
		let error = {};
		if (e.response.data.error.status == "401") {
			error = { error: "TOKEN_IS_NOT_VALID" };
		} else if (e.response.data.error.status == "429") {
			error = { error: "HAS_EXCEEDED_RATE_LIMITS" };
		}

		return error;
	}
	get loginUrl() {
		const state = uuidv4();

		const loginURl = new URL("https://accounts.spotify.com/authorize");

		const scops = this.scops.join(" ");
		const args = {
			response_type: "code",
			client_id: process.env.CLIENT_ID,
			scope: scops,
			redirect_uri: process.env.REDIRECT_URI,
			state: state,
		};

		Object.keys(args).forEach((key) => {
			loginURl.searchParams.set(key, args[key]);
		});

		return loginURl.toString();
	}
	async getMe() {
		let res;
		try {
			res = await this.userReq.get("/me");
		} catch (e) {
			return this.handleGlobalErrors(e);
		}
		return res.data;
	}
	async getUserTokens(code) {
		const data = {
			code: code,
			redirect_uri: process.env.REDIRECT_URI,
			grant_type: "authorization_code",
		};
		let res;
		try {
			const url =
				"https://accounts.spotify.com/api/token?" +
				querystring.stringify(data);
			console.log(url);
			res = await this.apiReq.post(url);
		} catch (e) {
			return this.handleGlobalErrors(e);
		}
		const { access_token: accessToken, refresh_token: refreshToken } =
			res.data;
		return { accessToken, refreshToken };
	}

	async getFreshTokens(refreshToken) {
		const data = {
			refresh_token: refreshToken,
			redirect_uri: process.env.REDIRECT_URI,
			grant_type: "refresh_token",
		};
		let res;
		try {
			const url =
				"https://accounts.spotify.com/api/token?" +
				querystring.stringify(data);
			res = await this.apiReq.post(url);
		} catch (e) {
			return this.handleGlobalErrors(e);
		}
		const { access_token: accessToken, refresh_token: newRefreshToken } =
			res.data;
		return {
			accessToken,
			refreshToken: newRefreshToken ? newRefreshToken : refreshToken,
		};
	}
	async getPlayLists(userId, offset = 0, limit = 20) {
		const data = {
			offset,
			limit,
		};
		let res;
		try {
			const url = `https://api.spotify.com/v1/users/${userId}/playlists?${querystring.stringify(
				data
			)}`;
			res = await this.userReq.get(url);
		} catch (e) {
			return this.handleGlobalErrors(e);
		}

		const playListItems = res.data;
		return playListItems;
	}
}
module.exports = SpotifyApi;
