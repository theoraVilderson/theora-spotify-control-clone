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
		if (e?.response?.data?.error?.status == "401") {
			error = { error: "TOKEN_IS_NOT_VALID" };
		} else if (e?.response?.data?.error?.status == "429") {
			error = { error: "HAS_EXCEEDED_RATE_LIMITS" };
		}

		return error;
	}
	async requestWrapper(func) {
		let res;
		try {
			res = await func.bind(this)();
		} catch (e) {
			console.log(e?.response?.data?.error ?? e);
			return this.handleGlobalErrors(e);
		}

		return res;
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
		return await this.requestWrapper(async () => {
			return (await this.userReq.get("/me")).data;
		});
	}
	async getUserTokens(code) {
		return await this.requestWrapper(async () => {
			const data = {
				code: code,
				redirect_uri: process.env.REDIRECT_URI,
				grant_type: "authorization_code",
			};
			const query = querystring.stringify(data);
			let url = "https://accounts.spotify.com/api/token?";
			url = url + query;

			const res = await this.apiReq.post(url);
			const { access_token: accessToken, refresh_token: refreshToken } =
				res.data;
			return { accessToken, refreshToken };
		});
	}

	async getFreshTokens(userRefreshToken) {
		return this.requestWrapper(async () => {
			const data = {
				refresh_token: userRefreshToken,
				redirect_uri: process.env.REDIRECT_URI,
				grant_type: "refresh_token",
			};
			const query = querystring.stringify(data);
			let url = "https://accounts.spotify.com/api/token?";
			url = url + query;

			const res = await this.apiReq.post(url);
			const {
				access_token: accessToken,
				refresh_token: newRefreshToken,
			} = res.data;
			return {
				accessToken,
				refreshToken: newRefreshToken ?? userRefreshToken,
			};
		});
	}
	async getPlayLists(userId, offset = 0, limit = 20) {
		return this.requestWrapper(async () => {
			const data = { offset, limit };
			const query = querystring.stringify(data);
			const url = `users/${userId}/playlists?${query}`;
			const res = await this.userReq.get(url);
			return res.data;
		});
	}
	async getTopArtists() {
		return this.requestWrapper(async () => {
			const url = `me/top/artists`;
			const res = await this.userReq.get(url);
			return res.data;
		});
	}
	async isTargetFollowed(artistId, type) {
		return this.requestWrapper(async () => {
			const url = `me/following/contains?type=${type}&ids=${artistId}`;
			const res = await this.userReq.get(url);

			return res.data;
		});
	}
	async isFollowed(targetId) {
		const isArtistFollowed = await this.isTargetFollowed(
			targetId,
			"artist"
		);
		const isUserFollowed = await this.isTargetFollowed(targetId, "artist");
		if (isArtistFollowed.error) throw isArtistFollowed;
		if (isUserFollowed.error) throw isUserFollowed;

		return isArtistFollowed.map((e, key) => {
			return e || isUserFollowed[key];
		});
	}
	async getAllGerenresName() {
		return this.requestWrapper(async () => {
			const url = `recommendations/available-genre-seeds`;
			genres = await this.userReq.get(url);
			return genres.data;
		});
	}

	async getArtist(artistId) {
		return this.requestWrapper(async () => {
			const url = `artists/${artistId}`;
			const res = await this.userReq.get(url);
			return res.data;
		});
	}
	async follow(targetId, type) {
		return this.requestWrapper(async () => {
			const url = `me/following?type=${type}&ids=${targetId}`;
			const res = await this.userReq.put(url, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});
			return { follow: true };
		});
	}
	async unFollow(targetId, type) {
		return this.requestWrapper(async () => {
			const url = `me/following?type=${type}&ids=${targetId}`;
			const res = await this.userReq.delete(url, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});
			return { unfollow: true };
		});
	}
	async getSuggestions() {
		return this.requestWrapper(async () => {
			const topArtists = await this.getTopArtists();
			if (topArtists.error) throw topArtists;

			let { items } = topArtists;
			items = items.filter((e) => e.type === "artist");
			// if(items.length)
			let url = `recommendations?`;
			if (!items.length) {
				url += "seed_genres=classical";
			} else {
				const targetArtist = items.reduce(
					(e, n) => {
						return e.popularity <= n.popularity ? n : e;
					},
					{ popularity: 0 }
				);
				url += `seed_artists=${targetArtist.id}`;
			}

			const suggestionsTracks = await this.userReq.get(url);

			const targetArtist = await this.getArtist(
				suggestionsTracks.data.seeds[0].id
			);
			if (targetArtist.error) throw targetArtist;

			const isFollowed = await this.isFollowed(
				suggestionsTracks.data.seeds[0].id
			);
			if (isFollowed.error) throw isFollowed;

			const suggestions = {
				...suggestionsTracks.data,
				targetArtist: { ...targetArtist, isFollowed: isFollowed[0] },
			};

			return suggestions;
		});
	}
}
module.exports = SpotifyApi;
