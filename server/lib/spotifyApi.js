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
			// console.log(e?.response?.data?.error ?? e);
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
	async getFullyPlayList(playlistId, offset = 0, limit = 20) {
		return this.requestWrapper(async () => {
			const playListInfo = await this.getPlayList(playlistId);
			const playListItems = await this.getPlayListItems(
				playlistId,
				offset,
				limit
			);

			const self = await this.getMe();

			if (playListInfo.error) throw playListInfo;
			if (playListItems.error) throw playListItems;
			if (self.error) throw self;
			const isPlaylistFollowed = await this.isTargetFollowed(
				playlistId,
				"playlist",
				self.id
			);
			if (isPlaylistFollowed.error) throw isPlaylistFollowed;

			const allTracksId = playListItems.items.map((e) => e.track.id);
			const tracksLike = await this.isLikedTarget(allTracksId, "track");
			if (tracksLike.error) throw tracksLike;

			playListItems.items = playListItems.items.map((e, k) => {
				return { ...e, track: { ...e.track, isLiked: tracksLike[k] } };
			});

			return {
				playlistInfo: {
					...playListInfo,
					isFollowed: isPlaylistFollowed[0],
				},
				playlistItems: playListItems,
			};
		});
	}
	async getPlayList(playlistId) {
		return this.requestWrapper(async () => {
			const url = `playlists/${playlistId} `;
			const res = await this.userReq.get(url);
			return res.data;
		});
	}
	async getPlayListItems(playlistId, offset = 0, limit = 20) {
		return this.requestWrapper(async () => {
			const data = { offset, limit };
			const query = querystring.stringify(data);
			const url = `playlists/${playlistId}/tracks?${query}`;
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
	async isTargetFollowed(targetId, type, userIds) {
		return this.requestWrapper(async () => {
			const playListLink = `playlists/${targetId}/followers/contains?ids=${userIds}`;
			const isPlayList = type === "playlist";
			const url = isPlayList
				? playListLink
				: `me/following/contains?type=${type}&ids=${targetId}`;

			const res = await this.userReq.get(url);

			return res.data;
		});
	}
	async isFollowed(targetId, playlistId) {
		const isArtistFollowed = await this.isTargetFollowed(
			targetId,
			"artist"
		);
		const isUserFollowed = await this.isTargetFollowed(targetId, "user");
		let isPlaylistFollowed;
		if (isArtistFollowed.error) throw isArtistFollowed;
		if (isUserFollowed.error) throw isUserFollowed;

		if (playlistId) {
			isPlaylistFollowed = await this.isTargetFollowed(
				playlistId,
				"playlist",
				targetId
			);
			if (isPlaylistFollowed.error) throw isPlaylistFollowed;
		}

		return isArtistFollowed.map((e, key) => {
			return (
				e ||
				isUserFollowed[key] ||
				(playlistId && isPlaylistFollowed[key])
			);
		});
	}
	async follow(targetId, type, isPublic = true) {
		return this.requestWrapper(async () => {
			const playListLink = `playlists/${targetId}/followers`;
			const isPlayList = type === "playlist";

			const url = isPlayList
				? playListLink
				: `me/following?type=${type}&ids=${targetId}`;

			const data = isPlayList ? { isPublic } : null;

			const res = await this.userReq.put(url, data, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});
			return { follow: true };
		});
	}
	async unFollow(targetId, type) {
		return this.requestWrapper(async () => {
			const playListLink = `playlists/${targetId}/followers`;
			const isPlayList = type === "playlist";

			const url = isPlayList
				? playListLink
				: `me/following?type=${type}&ids=${targetId}`;
			const res = await this.userReq.delete(url, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});
			return { unfollow: true };
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

	async isLikedTarget(targetId, type) {
		return this.requestWrapper(async () => {
			const url = `me/${type}s/contains?ids=${targetId}`;
			const res = await this.userReq.get(url);
			return res.data;
		});
	}

	async likeTarget(targetId, type) {
		return this.requestWrapper(async () => {
			const url = `me/${type}s?ids=${targetId}`;
			const res = await this.userReq.put(url);
			return { like: true };
		});
	}

	async unLikeTarget(targetId, type) {
		return this.requestWrapper(async () => {
			const url = `me/${type}s?ids=${targetId}`;
			const res = await this.userReq.delete(url);
			return { unLike: true };
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
				const targetArtist = items[~~(Math.random() * items.length)];
				url += `seed_artists=${targetArtist.id}`;
			}

			const suggestionsTracks = await this.userReq.get(url);

			const targetArtist = await this.getArtist(
				suggestionsTracks.data.seeds[0].id
			);
			if (targetArtist.error) throw targetArtist;

			const isFollowed = await this.isTargetFollowed(
				suggestionsTracks.data.seeds[0].id,
				"artist"
			);
			if (isFollowed.error) throw isFollowed;

			const suggestions = {
				...suggestionsTracks.data,
				targetArtist: { ...targetArtist, isFollowed: isFollowed[0] },
			};

			let allTracks = suggestions.tracks.reduce((re, cu) => {
				if (!re[cu.id]) re[cu.id] = cu;
				return re;
			}, {});

			const currentlyPlaying = await this.getCurrentlyPlaying();

			const isCurrentlyPlaying = !!currentlyPlaying?.item;

			if (currentlyPlaying?.error) return currentlyPlaying;

			if (isCurrentlyPlaying) {
				if (allTracks[currentlyPlaying.item.id]) {
					delete allTracks[currentlyPlaying.item.id];
				}

				suggestions.tracks.unshift(currentlyPlaying.item);
				suggestions.tracks = suggestions.tracks.slice(0, 20);
				allTracks = suggestions.tracks.reduce((re, cu) => {
					if (!re[cu.id]) re[cu.id] = cu;
					return re;
				}, {});
			}

			const recentlyPlayed = await this.getRecentlyPlayedTracks();

			if (recentlyPlayed.error) throw recentlyPlayed;

			const recentlySongs = Object.values(
				recentlyPlayed.items.reduce((re, cu) => {
					if (!re[cu.track.id] && !allTracks[cu.track.id])
						re[cu.track.id] = cu.track;
					return re;
				}, {})
			).slice(0, 5);

			suggestions.tracks.splice(+isCurrentlyPlaying, 0, ...recentlySongs);
			suggestions.tracks = suggestions.tracks.slice(0, 20);

			const allTracksId = suggestions.tracks.map((e) => e.id);
			const tracksLike = await this.isLikedTarget(allTracksId, "track");
			if (tracksLike.error) throw tracksLike;

			suggestions.tracks = suggestions.tracks.map((e, k) => {
				return { ...e, isLiked: tracksLike[k] };
			});
			return suggestions;
		});
	}

	async getCurrentlyPlaying(type = "track") {
		return this.requestWrapper(async () => {
			const url = `me/player/currently-playing?additional_types=${type}`;
			const res = await this.userReq.get(url);
			return res.data;
		});
	}
	async getRecentlyPlayedTracks() {
		return this.requestWrapper(async () => {
			const url = `me/player/recently-played`;
			const res = await this.userReq.get(url);

			return res.data;
		});
	}
	async getPlayerState(type = "track") {
		return this.requestWrapper(async () => {
			const url = `me/player?additional_types=${type}`;
			const res = await this.userReq.get(url);
			const tracksLike = await this.isLikedTarget(
				res.data.item.id,
				"track"
			);
			if (tracksLike.error) throw tracksLike;
			res.data.item.isLiked = tracksLike[0];

			return res.data;
		});
	}
	async setPlayerVolume(volume_percent = 50) {
		return this.requestWrapper(async () => {
			const url = `me/player/volume?volume_percent=${volume_percent}`;
			const res = await this.userReq.put(url, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});
			return { volume_percent: true };
		});
	}
	async playerSeekTo(position_ms = 50) {
		return this.requestWrapper(async () => {
			const url = `me/player/seek?position_ms=${position_ms}`;
			const res = await this.userReq.put(url, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});
			return { position_ms: true };
		});
	}
	async playerRepeat(state) {
		return this.requestWrapper(async () => {
			const url = `me/player/repeat?state=${state}`;
			const res = await this.userReq.put(url, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});
			return { [state + "_repeat"]: true };
		});
	}
	async playerShuffle(state) {
		return this.requestWrapper(async () => {
			const url = `me/player/shuffle?state=${state ? "true" : "false"}`;
			const res = await this.userReq.put(url, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});
			return { shuffle: state };
		});
	}
	async playerPlayPause(type = "play", uris = []) {
		uris = uris.filter((e) => e);
		const shouldUseUris = type === "play" && uris.length;

		return this.requestWrapper(async () => {
			const url = `me/player/${type}`;
			const data = !shouldUseUris ? null : { uris };

			const res = await this.userReq.put(url, data, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});

			return { [type]: true };
		});
	}
}
module.exports = SpotifyApi;
