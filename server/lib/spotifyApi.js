const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const querystring = require("querystring");
const FormData = require("form-data");

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
		if (
			e?.response?.data?.error?.status == "401" ||
			e.error === "TOKEN_IS_NOT_VALID"
		) {
			error = { error: "TOKEN_IS_NOT_VALID" };
		} else if (
			e?.response?.data?.error?.status == "429" ||
			e.error === "HAS_EXCEEDED_RATE_LIMITS"
		) {
			error = { error: "HAS_EXCEEDED_RATE_LIMITS" };
		}
		console.trace(e?.response?.data?.error ?? e);

		return error;
	}
	async requestWrapper(func) {
		let res;
		try {
			res = await func.bind(this)();
		} catch (e) {
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
	async getUser(userId) {
		return await this.requestWrapper(async () => {
			const me = await this.getMe();
			if (me.error) throw me;

			const user = await this.userReq.get(`/users/${userId}`);

			const isSameUser = me.id === user.data.id;

			if (!isSameUser) {
				const isFollowed = await this.isTargetFollowed(
					user.data.id,
					"user"
				);
				if (isFollowed.error) throw isFollowed;
				user.data.isFollowed = isFollowed[0];
			}

			return isSameUser ? me : user.data;
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
	async setPlaylist({ id, userId, playlistCover, ...rest }) {
		return this.requestWrapper(async () => {
			const method = !id ? "post" : "put";

			const url = id
				? `/playlists/${id}?ids=${userId}`
				: `users/${userId}/playlists`;

			console.log(rest);
			const res = await this.userReq[method](url, rest, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});
			id = id ?? res.data.id;
			if (playlistCover) {
				const uploadRes = await this.userReq.put(
					`/playlists/${id}/images`,
					playlistCover.toString("base64"),
					{
						headers: {
							"Content-Type": "image/jpeg",
						},
						validateStatus: function (status) {
							return status >= 200 && status <= 204; // default
						},
					}
				);
			}

			if (res.data) {
				const getUploadedImage = await this.userReq.get(
					`/playlists/${id}/images`
				);
				res.data.images = getUploadedImage.data;

				return res.data;
			}
			const playlist = await this.getPlayList(id);
			return playlist;
		});
	}
	async getPlayLists(userId, offset = 0, limit = 20, checkLike = false) {
		return this.requestWrapper(async () => {
			const data = { offset, limit };
			const query = querystring.stringify(data);
			const url = `users/${userId}/playlists?${query}`;
			const res = await this.userReq.get(url);

			const allPlaylistsId = res.data.items.map((e) => e.id);

			const currentUser = await this.getMe();
			if (currentUser.error) return currentUser;

			if (!checkLike) return res.data;

			for (const playlistCount in allPlaylistsId) {
				const playlistId = allPlaylistsId[playlistCount];

				const playListFollows = await this.isTargetFollowed(
					playlistId,
					"playlist",
					currentUser.id
				);
				if (playListFollows.error) throw playListFollows;

				res.data.items[playlistCount] = {
					...res.data.items[playlistCount],
					isFollowed: playListFollows[0],
				};
			}

			return res.data;
		});
	}
	async getFullyPlayList(playlistId, userId, offset = 0, limit = 20) {
		return this.requestWrapper(async () => {
			const playListInfo = await this.getPlayList(playlistId);
			const playListItems = await this.getPlayListItems(
				playlistId,
				offset,
				limit
			);

			if (playListInfo.error) throw playListInfo;
			if (playListItems.error) throw playListItems;

			const isPlaylistFollowed = await this.isTargetFollowed(
				playlistId,
				"playlist",
				userId
			);
			if (isPlaylistFollowed.error) throw isPlaylistFollowed;

			const allTracksId = playListItems.items.map((e) => e.track.id);

			if (allTracksId.length) {
				const tracksLike = await this.isLikedTarget(
					allTracksId,
					"track"
				);
				if (tracksLike.error) throw tracksLike;

				playListItems.items = playListItems.items.map((e, k) => {
					return {
						...e,
						track: { ...e.track, isLiked: tracksLike[k] },
					};
				});
			}

			return {
				...playListInfo,
				isFollowed: isPlaylistFollowed[0],
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
	async addToPlaylist(playlistId, uris) {
		return this.requestWrapper(async () => {
			const data = { uris };
			const query = querystring.stringify(data);
			const url = `playlists/${playlistId}/tracks?${query}`;
			const res = await this.userReq.post(url);
			return res.data;
		});
	}
	async removeFromPlaylist(playlistId, uris) {
		return this.requestWrapper(async () => {
			const data = uris.split(",").reduce((r, d) => {
				const type = "tracks";

				if (!r[type]) {
					r[type] = [
						{
							uri: d,
						},
					];
					return r;
				}

				r[type].push({
					uri: d,
				});
				return r;
			}, {});

			console.log(data);

			const url = `playlists/${playlistId}/tracks`;

			const res = await this.userReq.delete(url, {
				data,
			});
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
			const isFollowed = await this.isTargetFollowed(artistId, "artist");
			if (isFollowed.error) throw isFollowed;
			res.data = {
				...res.data,
				isFollowed: isFollowed[0],
			};

			return res.data;
		});
	}
	async getArtistTopTracks(artistId, country = "us") {
		return this.requestWrapper(async () => {
			const url = `artists/${artistId}/top-tracks/?country=${country}`;
			const res = await this.userReq.get(url);

			const allTracksId = res.data.tracks.map((e) => e.id);

			const tracksLike = await this.isLikedTarget(allTracksId, "track");
			if (tracksLike.error) throw tracksLike;

			res.data.tracks = res.data.tracks.map((e, k) => {
				return { ...e, isLiked: tracksLike[k] };
			});

			return res.data;
		});
	}
	async getArtistAlbums(artistId, offset, limit) {
		return this.requestWrapper(async () => {
			const data = { offset, limit };
			const query = querystring.stringify(data);
			const url = `artists/${artistId}/albums?${query}`;
			const res = await this.userReq.get(url);
			const allAlbumsId = res.data.items.map((e) => e.id);

			const albumsLike = await this.isLikedTarget(
				allAlbumsId + "",
				"album"
			);
			if (albumsLike.error) throw albumsLike;

			res.data.items = res.data.items.map((e, k) => {
				return { ...e, isLiked: albumsLike[k] };
			});

			return res.data;
		});
	}
	async getAlbumTracks(albumId, offset, limit) {
		return this.requestWrapper(async () => {
			const data = { offset, limit };
			const query = querystring.stringify(data);
			const url = `albums/${albumId}/tracks?${query}`;
			const res = await this.userReq.get(url);
			const allTracksId = res.data.items.map((e) => e.id);
			const albumTracks = await this.getTracks(
				allTracksId,
				offset,
				limit
			);
			if (albumTracks.error) throw albumTracks;

			res.data.items = albumTracks.tracks;
			return res.data;
		});
	}
	async getAlbum(albumId) {
		return this.requestWrapper(async () => {
			const url = `albums/${albumId}`;
			const res = await this.userReq.get(url);

			const tracksLike = await this.isLikedTarget(res.data.id, "album");

			if (tracksLike.error) throw tracksLike;
			res.data.isLiked = tracksLike[0];

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

			// use top artist for suggestions or default genres
			//
			if (!items?.length) {
				url += "seed_genres=country,alternative,samba";
			} else {
				const targetArtist = items[~~(Math.random() * items.length)];
				url += `seed_artists=${targetArtist.id}`;
			}

			const suggestionsTracks = await this.userReq.get(url);

			let findArtistSeed = suggestionsTracks.data.seeds.find(
				(e) => e.type === "artist"
			);
			const firstItem = suggestionsTracks?.data?.tracks?.[0];

			findArtistSeed =
				findArtistSeed?.id ??
				firstItem?.artists?.[0]?.id ??
				(firstItem?.type === "artist" ? firstItem?.id : null);

			const targetArtist = await this.getArtist(findArtistSeed);
			if (targetArtist.error) throw targetArtist;

			const isFollowed = await this.isTargetFollowed(
				findArtistSeed,
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

			const currentlyPlaying = await this.getPlayerState();

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

			let allTracksId = suggestions.tracks.map((e) => e.id);
			const allTracksLike = [];

			if (currentlyPlaying?.item?.type === "episode") {
				const eposideLike = await this.isLikedTarget(
					allTracksId[0],
					"episode"
				);
				if (eposideLike.error) throw eposideLike;
				allTracksLike.push(...eposideLike);
			}
			const tracksLike = await this.isLikedTarget(allTracksId, "track");
			if (tracksLike.error) throw tracksLike;

			allTracksLike.push(...tracksLike);

			suggestions.tracks = suggestions.tracks.map((e, k) => {
				return { ...e, isLiked: tracksLike[k] };
			});
			return suggestions;
		});
	}

	async getCurrentlyPlaying(type) {
		return this.requestWrapper(async () => {
			const query = type ? `additional_types=${type}` : "";
			const url = `me/player/currently-playing${
				query ? "?" + query : ""
			}`;

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
	async getPlayerState(type) {
		return this.requestWrapper(async () => {
			const query = type ? `additional_types=${type}` : "";
			const url = `me/player${query ? "?" + query : ""}`;

			const res = await this.userReq.get(url);

			if (!res.data) return {};

			if (!res?.data?.item) {
				const playingItem = await this.getCurrentlyPlaying(
					res.data.type
				);

				res.item = playingItem;
			}

			const tracksLike = await this.isLikedTarget(
				res.data.item.id,
				res.data.item.type
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
	async playerPlayPause(
		type = "play",
		{ uris = [], context_uri = "", offset = "" } = {}
	) {
		uris = uris.filter((e) => e);
		const shouldUseUris = type === "play" && uris.length;
		const shouldUseContextURI = type === "play" && !!context_uri?.trim();
		const shouldUseOffset = type === "play" && !!offset.trim();

		return this.requestWrapper(async () => {
			const url = `me/player/${type}`;
			let data = {};

			if (shouldUseUris) data.uris = uris;
			if (shouldUseContextURI) data.context_uri = context_uri;
			if (shouldUseOffset) data.offset = offset;

			data = Object.keys(data).length ? data : null;

			const res = await this.userReq.put(url, data, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});

			return { [type]: true };
		});
	}
	async getDevices() {
		return this.requestWrapper(async () => {
			const url = `me/player/devices`;

			const res = await this.userReq.get(url);

			return res.data;
		});
	}
	async setTransfromPlayback({ play, deviceId }) {
		return this.requestWrapper(async () => {
			const url = `me/player`;

			const data = {
				device_id: deviceId,
				play,
			};
			const res = await this.userReq.put(url, data, {
				validateStatus: function (status) {
					return status >= 200 && status <= 204; // default
				},
			});

			return res.data;
		});
	}
	async getTrack(trackId) {
		return this.requestWrapper(async () => {
			const res = await this.getTracks(trackId);
			if (res.error) throw res;
			return res.tracks[0];
		});
	}

	async getTracks(trackIds) {
		return this.requestWrapper(async () => {
			const data = { ids: trackIds + "" };
			const query = querystring.stringify(data);
			const url = `tracks?${query}`;
			const res = await this.userReq.get(url);

			console.log(res.data);
			const allTracksId = res.data.tracks.map((e) => e.id);

			const tracksLike = await this.isLikedTarget(allTracksId, "track");
			if (tracksLike.error) throw tracksLike;

			res.data.tracks = res.data.tracks.map((e, k) => {
				return { ...e, isLiked: tracksLike[k] };
			});

			return res.data;
		});
	}

	async getLiked(type, offset = 0, limit = 20, after) {
		return this.requestWrapper(async () => {
			const data = { offset, limit };
			if (type === "artist") {
				data.type = type;
			}
			if (after) {
				data.after = after;
			}
			const query = querystring.stringify(data);
			const url = `me/${
				type === "artist" ? "following" : type + "s"
			}?${query}`;
			console.log(url, type);
			const res = await this.userReq.get(url);

			if (type === "artist") {
				res.data = res.data.artists;
			}
			res.data.items = res.data.items.map((e, k) => {
				let lastRes = e;

				const item = e[type];

				delete lastRes[type];

				lastRes = { ...lastRes, ...item };

				const followedType = ["playlist", "show", "artist"].includes(
					lastRes.type
				)
					? "isFollowed"
					: "isLiked";

				return { ...lastRes, [followedType]: true };
			});

			return res.data;
		});
	}
	async getEpisode(episodeId) {
		return this.requestWrapper(async () => {
			const res = await this.getEpisodes(episodeId);
			if (res.error) throw res;
			return res.episodes[0];
		});
	}
	async getEpisodes(episodeIds) {
		return this.requestWrapper(async () => {
			const data = { ids: episodeIds + "" };
			const query = querystring.stringify(data);
			const url = `episodes?${query}`;
			const res = await this.userReq.get(url);

			const allEpisodesId = res.data.episodes.map((e) => e.id);

			const episodesLike = await this.isLikedTarget(
				allEpisodesId,
				"episode"
			);
			if (episodesLike.error) throw episodesLike;

			res.data.episodes = res.data.episodes.map((e, k) => {
				return { ...e, isLiked: episodesLike[k] };
			});
			return res.data;
		});
	}

	async getShow(showId) {
		return this.requestWrapper(async () => {
			const res = await this.getShows(showId);
			if (res.error) throw res;
			return res.shows[0];
		});
	}

	async getShows(showIds) {
		return this.requestWrapper(async () => {
			const data = { ids: showIds + "" };
			const query = querystring.stringify(data);
			const url = `shows?${query}`;
			const res = await this.userReq.get(url);

			const allShowsId = res.data.shows.map((e) => e.id);

			const showsLike = await this.isLikedTarget(allShowsId, "show");
			if (showsLike.error) throw showsLike;

			res.data.shows = res.data.shows.map((e, k) => {
				return { ...e, isLiked: showsLike[k] };
			});
			return res.data;
		});
	}
	async getShowEpisodes(showId, offset = 0, limit = 10) {
		return this.requestWrapper(async () => {
			const data = { offset, limit };
			const query = querystring.stringify(data);
			const url = `shows/${showId}/episodes?${query}`;
			const res = await this.userReq.get(url);
			const allEpisodesId = res.data.items.map((e) => e.id);

			const episodesLike = await this.isLikedTarget(
				allEpisodesId + "",
				"episode"
			);
			if (episodesLike.error) throw episodesLike;

			res.data.items = res.data.items.map((e, k) => {
				return { ...e, isLiked: episodesLike[k] };
			});

			return res.data;
		});
	}
	async search(
		option = {
			q: "best song",
			type: "album,artist,playlist,track,show,episode",
		}
	) {
		return this.requestWrapper(async () => {
			let { q, type, limit, offset } = option;

			if (!type) {
				type = "album,artist,playlist,track,show,episode";
			} else if (Array.isArray(type)) {
				type = type + "";
			}

			const data = { q, type, limit, offset };
			const query = querystring.stringify(data);
			const url = `search?${query}`;
			const res = await this.userReq.get(url);

			return res.data;
		});
	}
}
module.exports = SpotifyApi;
