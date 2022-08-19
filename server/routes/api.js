const express = require("express");
const router = express.Router();
const lyricsFinder = require("lyrics-finder");
const Genius = require("genius-lyrics");
const Client = new Genius.Client(); // Scrapes if no key is provided
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// check if user live

async function isUserLive(req) {
	let res = true;
	try {
		req.spotifyApi.setToken(req.cookies.accessToken);
		const er = await req.spotifyApi.getMe();
		if (er.error) throw er.error;
	} catch (e) {
		res = false;
	}
	return res;
}

function reviveUser(req, accessToken, refreshToken) {}
function globalErrorHandler(defaultError, data) {
	if (!Object.keys(data).length) {
		console.log({ defaultError }, data);
		return {
			status: true,
			data: { error: defaultError },
		};
	} else if (data.error) {
		console.log({ defaultError }, data);
		return {
			status: true,
			data: { error: data.error },
		};
	}
	return null;
}
function isUserLoggedIn(req) {
	return req.cookies.accessToken && isUserLive(req);
}

router.get("/loginUrl", (req, res) => {
	const loginUrl = req.spotifyApi.loginUrl;

	// check if user logged in

	if (isUserLoggedIn(req)) {
		return res.json({ status: true, data: { error: "YOU_ARE_LOGGED_IN" } });
	}
	res.cookie("loginChallange", new URL(loginUrl).searchParams.get("state"), {
		maxAage: 9555 ** 99,
	});

	return res.json({ status: true, data: { result: loginUrl } });
});

router.get("/userTokens", async (req, res) => {
	const { code } = req.query;

	if (!code)
		return res.json({ status: true, data: { error: "INVALID_CODE" } });

	const userTokens = await req.spotifyApi.getUserTokens(code);
	const error = globalErrorHandler("COULD_NOT_GET_USER_TOKEN", userTokens);

	if (error) {
		return res.json(error);
	}

	res.cookie("loginChallange", "", { maxAage: 0 });
	res.cookie("accessToken", userTokens.accessToken, { maxAage: 3500 });
	res.cookie("refreshToken", userTokens.refreshToken, {
		maxAage: 7 * 24 * 60 * 60 * 1000,
	});

	return res.json({ status: true, data: { result: userTokens } });
});

router.get("/updateTokens", async (req, res) => {
	if (!req.cookies.refreshToken)
		return res.json({ status: true, data: { error: "RELOGIN_USER" } });

	const userTokens = await req.spotifyApi.getFreshTokens(
		req.cookies.refreshToken
	);
	const error = globalErrorHandler(
		"COULD_NOT_REFRESH_USER_TOKEN",
		userTokens
	);

	if (error) {
		return res.json(error);
	}
	res.cookie("accessToken", userTokens.accessToken, { maxAage: 3500 });
	res.cookie("refreshToken", userTokens.refreshToken, {
		maxAage: 7 * 24 * 60 * 60 * 1000,
	});

	return res.json({ status: true, data: { result: userTokens } });
});
router.get("/logout", (req, res) => {
	const { spotify } = req.query;

	res.cookie("accessToken", "", { maxAage: 0 });
	res.cookie("refreshToken", "", {
		maxAage: 0,
	});
	if (!!spotify) {
		return res.redirect("https://accounts.spotify.com/en/logout");
	}
	return res.json({ status: true, data: { result: "USER_LOGGED_OUT" } });
});

// if routes that need tokens
router.use("*", (req, res, next) => {
	if (!req.cookies.accessToken)
		return res.json({
			status: true,
			data: { error: "TOKEN_IS_NOT_VALID" },
		});

	req.spotifyApi.setToken(req.cookies.accessToken);

	return next();
});

// search
router.get("/search", async (req, res) => {
	const {
		offset = 0,
		limit = 10,
		type = "album,artist,playlist,track,show,episode",
		query: q = "",
	} = req.query;

	const userInfo = await req.spotifyApi.search({ offset, limit, type, q });
	const error = globalErrorHandler("COULD_NOT_GET_SEARCH_RESAULT", userInfo);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: userInfo } });
});
// user
router.get("/user", async (req, res) => {
	const userInfo = await req.spotifyApi.getMe();
	const error = globalErrorHandler("COULD_NOT_GET_USER_INFO", userInfo);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: userInfo } });
});

router.get("/user/:userId", async (req, res) => {
	const { userId } = req.params;

	const userInfo = await req.spotifyApi.getUser(userId);
	const error = globalErrorHandler(
		"COULD_NOT_GET_TARGET_USER_INFO",
		userInfo
	);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: userInfo } });
});

router
	.route("/user/:userId/follow")
	.put(async (req, res) => {
		const { userId } = req.params;

		const follow = await req.spotifyApi.follow(userId, "user");
		const error = globalErrorHandler("COULD_NOT_FOLLOW_USER", follow);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: follow } });
	})
	.delete(async (req, res) => {
		const { userId } = req.params;

		const unFollow = await req.spotifyApi.unFollow(userId, "user");
		const error = globalErrorHandler("COULD_NOT_UNSAVE_USER", unFollow);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: unFollow } });
	});

router.get("/suggestions", async (req, res) => {
	const suggestions = await req.spotifyApi.getSuggestions();
	const error = globalErrorHandler("COULD_NOT_GET_SUGGESTIONS", suggestions);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: suggestions } });
});

async function playListSetHandlerasync(req, res) {
	const { id, userId } = req.query;

	const {
		playlistName = "new playlist",
		playlistDescription = "this is description",
		isPublic = false,
		isCollaborative = false,
	} = req.body;

	const playlistCover = req.file;

	const playlist = await req.spotifyApi.setPlaylist({
		playlistCover: playlistCover?.buffer,
		name: playlistName,
		description: playlistDescription,
		public: isPublic !== "false",
		collaborative: isCollaborative !== "false",
		id,
		userId,
	});

	const error = globalErrorHandler("COULD_NOT_SET_PLAYLIST", playlist);

	if (error) {
		return res.json(error);
	}
	return res.json({ status: true, data: { result: playlist } });
}
router
	.route("/playlist")
	.post(upload.single("playlistCover"), playListSetHandlerasync)
	.put(upload.single("playlistCover"), playListSetHandlerasync);

// PlayList Route
router.get("/playlists", async (req, res) => {
	let { userId, offset = 0, limit = 20, checkLike = false } = req.query;

	if (!userId) return res.json(globalErrorHandler("please pass userId", {}));

	offset = parseInt(offset);
	limit = parseInt(limit);
	offset = isNaN(offset) || offset >= 100000 || offset < 0 ? 0 : offset;
	limit = isNaN(limit) || limit >= 50 || limit < 0 ? 20 : limit;
	checkLike = !(!checkLike || checkLike === "false");

	const userInfo = await req.spotifyApi.getPlayLists(
		userId,
		offset,
		limit,
		checkLike
	);
	const error = globalErrorHandler("COULD_NOT_GET_USER_PLAYLISTS", userInfo);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: userInfo } });
});
router.post("/playlist/:playlistId/tracks", async (req, res) => {
	const { playlistId } = req.params;

	const { uris = "" } = req.query;

	const addToPlaylist = await req.spotifyApi.addToPlaylist(playlistId, uris);
	const error = globalErrorHandler("COULD_NOT_SAVE_PLAYLIST", addToPlaylist);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: addToPlaylist } });
});

router
	.route("/playlist/:playlistId/tracks")
	.post(async (req, res) => {
		const { playlistId } = req.params;

		const { uris = "" } = req.query;

		const addToPlaylist = await req.spotifyApi.addToPlaylist(
			playlistId,
			uris
		);
		const error = globalErrorHandler(
			"COULD_NOT_SAVE_PLAYLIST",
			addToPlaylist
		);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: addToPlaylist } });
	})
	.delete(async (req, res) => {
		const { playlistId } = req.params;

		const { uris = "" } = req.query;

		const addToPlaylist = await req.spotifyApi.removeFromPlaylist(
			playlistId,
			uris
		);
		const error = globalErrorHandler(
			"COULD_NOT_SAVE_PLAYLIST",
			addToPlaylist
		);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: addToPlaylist } });
	});
router.get("/playlist/:playlistId", async (req, res) => {
	const { playlistId } = req.params;

	const playList = await req.spotifyApi.getPlayList(playlistId);
	const error = globalErrorHandler("COULD_NOT_GET_PLAYLIST", playList);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: playList } });
});
router.get("/playlistItems/:playlistId", async (req, res) => {
	const { playlistId } = req.params;
	const { offset = 0, limit = 20 } = req.query;
	const playlistItems = await req.spotifyApi.getPlayListItems(
		playlistId,
		offset,
		limit
	);
	const error = globalErrorHandler(
		"COULD_NOT_GET_PLAYLIST_ITEMS",
		playlistItems
	);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: playlistItems } });
});
router.get("/playlistFullInfo/:playlistId", async (req, res) => {
	const { playlistId } = req.params;
	const { offset = 0, limit = 20, userId } = req.query;
	const playlistFullInfo = await req.spotifyApi.getFullyPlayList(
		playlistId,
		userId,
		offset,
		limit
	);
	const error = globalErrorHandler(
		"COULD_NOT_GET_PLAYLIST_FULL_INFORMATION",
		playlistFullInfo
	);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: playlistFullInfo } });
});

router
	.route("/playlist/:playlistId/follow")
	.put(async (req, res) => {
		const { playlistId } = req.params;

		const follow = await req.spotifyApi.follow(playlistId, "playlist");
		const error = globalErrorHandler("COULD_NOT_SAVE_PLAYLIST", follow);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: follow } });
	})
	.delete(async (req, res) => {
		const { playlistId } = req.params;

		const unFollow = await req.spotifyApi.unFollow(playlistId, "playlist");
		const error = globalErrorHandler("COULD_NOT_UNSAVE_PLAYLIST", unFollow);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: unFollow } });
	});

// Artist Route
router
	.route("/artist/:artistId/follow")
	.put(async (req, res) => {
		const { artistId } = req.params;

		const follow = await req.spotifyApi.follow(artistId, "artist");
		const error = globalErrorHandler("COULD_NOT_FOLLOW", follow);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: follow } });
	})
	.delete(async (req, res) => {
		const { artistId } = req.params;

		const unFollow = await req.spotifyApi.unFollow(artistId, "artist");
		const error = globalErrorHandler("COULD_NOT_UNFOLLOW", unFollow);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: unFollow } });
	});
router.get("/artist/:artistId", async (req, res) => {
	const { artistId } = req.params;

	const artist = await req.spotifyApi.getArtist(artistId);
	const error = globalErrorHandler("COULD_NOT_GET_ARTIST", artist);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: artist } });
});
router.get("/artist/:artistId/top-tracks", async (req, res) => {
	const { artistId } = req.params;
	const { country = "us" } = req.query;

	const topTracks = await req.spotifyApi.getArtistTopTracks(
		artistId,
		country
	);
	const error = globalErrorHandler("COULD_NOT_GET_TOP_TRACKS", topTracks);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: topTracks } });
});
router.get("/artist/:artistId/albums", async (req, res) => {
	const { artistId } = req.params;

	let { offset = 0, limit = 10 } = req.query;
	offset = parseInt(offset);
	limit = parseInt(limit);
	offset = isNaN(offset) || offset >= 100000 || offset < 0 ? 0 : offset;
	limit = isNaN(limit) || limit >= 50 || limit < 0 ? 20 : limit;

	const albums = await req.spotifyApi.getArtistAlbums(
		artistId,
		offset,
		limit
	);
	const error = globalErrorHandler("COULD_NOT_GET_ARTIST_ALBUMS", albums);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: albums } });
});
// Album Route

router
	.route("/album/:albumId/like")
	.get(async (req, res) => {
		const { albumId } = req.params;

		const isLiked = await req.spotifyApi.isLikedTarget(albumId, "album");
		const error = globalErrorHandler("COULD_NOT_CHECK_LIKE", isLiked);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: isLiked } });
	})
	.put(async (req, res) => {
		const { albumId } = req.params;

		const like = await req.spotifyApi.likeTarget(albumId, "album");
		const error = globalErrorHandler("COULD_NOT_LIKE", like);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: like } });
	})
	.delete(async (req, res) => {
		const { albumId } = req.params;

		const unLike = await req.spotifyApi.unLikeTarget(albumId, "album");
		const error = globalErrorHandler("COULD_NOT_UNLIKE", unLike);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: unLike } });
	});
router.get("/album/:albumId/getAlbumTracks", async (req, res) => {
	const { albumId } = req.params;

	let { offset = 0, limit = 10 } = req.query;
	offset = parseInt(offset);
	limit = parseInt(limit);
	offset = isNaN(offset) || offset >= 100000 || offset < 0 ? 0 : offset;
	limit = isNaN(limit) || limit >= 50 || limit < 0 ? 20 : limit;

	const album = await req.spotifyApi.getAlbumTracks(albumId, offset, limit);
	const error = globalErrorHandler("COULD_NOT_GET_ALBUM_TRACKS", album);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: album } });
});

router.get("/album/:albumId", async (req, res) => {
	const { albumId } = req.params;

	console.log(albumId);

	const album = await req.spotifyApi.getAlbum(albumId);
	const error = globalErrorHandler("COULD_NOT_GET_ALBUM", album);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: album } });
});

// Track Route
router
	.route("/track/:trackId/like")
	.get(async (req, res) => {
		const { trackId } = req.params;

		const isLiked = await req.spotifyApi.isLikedTarget(trackId, "track");
		const error = globalErrorHandler("COULD_NOT_CHECK_LIKE", isLiked);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: isLiked } });
	})
	.put(async (req, res) => {
		const { trackId } = req.params;

		const like = await req.spotifyApi.likeTarget(trackId, "track");
		const error = globalErrorHandler("COULD_NOT_LIKE", like);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: like } });
	})
	.delete(async (req, res) => {
		const { trackId } = req.params;

		const unLike = await req.spotifyApi.unLikeTarget(trackId, "track");
		const error = globalErrorHandler("COULD_NOT_UNLIKE", unLike);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: unLike } });
	});
router.get("/track/lyrics", async (req, res) => {
	const { artists, name } = req.query;

	let lyrics = await lyricsFinder(artists, name);

	// if first lyric finder dosn't help then we use second one

	if (!lyrics) {
		try {
			const response = await Client.songs.search(`${name} ${artists}`);

			if (response[0]) {
				lyrics = await response[0].lyrics();
			} else {
				lyrics = {
					error: "COULD_NOT_FIND_LYRICS",
				};
			}
		} catch (e) {
			lyrics = {
				error: "COULD_NOT_FIND_LYRICS",
			};
		}
	}

	const error = globalErrorHandler("COULD_NOT_FIND_LYRICS", lyrics);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: lyrics } });
});
router.get("/track/:trackId", async (req, res) => {
	const { trackId } = req.params;

	const track = await req.spotifyApi.getTrack(trackId);
	const error = globalErrorHandler("COULD_NOT_GET_TRACK", track);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: track } });
});

// Episode Route
router
	.route("/episode/:episodeId/like")
	.get(async (req, res) => {
		const { episodeId } = req.params;

		const isLiked = await req.spotifyApi.isLikedTarget(
			episodeId,
			"episode"
		);
		const error = globalErrorHandler("COULD_NOT_CHECK_LIKE", isLiked);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: isLiked } });
	})
	.put(async (req, res) => {
		const { episodeId } = req.params;

		const like = await req.spotifyApi.likeTarget(episodeId, "episode");
		const error = globalErrorHandler("COULD_NOT_LIKE", like);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: like } });
	})
	.delete(async (req, res) => {
		const { episodeId } = req.params;

		const unLike = await req.spotifyApi.unLikeTarget(episodeId, "episode");
		const error = globalErrorHandler("COULD_NOT_UNLIKE", unLike);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: unLike } });
	});

router.get("/episode/:episodeId", async (req, res) => {
	const { episodeId } = req.params;

	const episode = await req.spotifyApi.getEpisode(episodeId);
	const error = globalErrorHandler("COULD_NOT_GET_EPISODE", episode);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: episode } });
});

// Shows Route
router
	.route("/show/:showId/like")
	.get(async (req, res) => {
		const { showId } = req.params;

		const isLiked = await req.spotifyApi.isLikedTarget(showId, "show");
		const error = globalErrorHandler("COULD_NOT_CHECK_LIKE", isLiked);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: isLiked } });
	})
	.put(async (req, res) => {
		const { showId } = req.params;

		const like = await req.spotifyApi.likeTarget(showId, "show");
		const error = globalErrorHandler("COULD_NOT_LIKE", like);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: like } });
	})
	.delete(async (req, res) => {
		const { showId } = req.params;

		const unLike = await req.spotifyApi.unLikeTarget(showId, "show");
		const error = globalErrorHandler("COULD_NOT_UNLIKE", unLike);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: unLike } });
	});

router.get("/show/:showId", async (req, res) => {
	const { showId } = req.params;
	let { offset = 0, limit = 10 } = req.query;

	const show = await req.spotifyApi.getShow(showId);
	const error = globalErrorHandler("COULD_NOT_GET_SHOW", show);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: show } });
});

router.get("/show/:showId/episodes", async (req, res) => {
	const { showId } = req.params;
	let { offset = 0, limit = 10 } = req.query;
	offset = parseInt(offset);
	limit = parseInt(limit);
	offset = isNaN(offset) || offset >= 100000 || offset < 0 ? 0 : offset;
	limit = isNaN(limit) || limit >= 50 || limit < 0 ? 20 : limit;

	const episodes = await req.spotifyApi.getShowEpisodes(
		showId,
		offset,
		limit
	);
	const error = globalErrorHandler("COULD_NOT_GET_SHOW_EPISODES", episodes);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: episodes } });
});

// likedTarget

router.get("/likedTarget/:type", async (req, res) => {
	let { type } = req.params;

	let { offset = 0, limit = 10, after = "" } = req.query;
	offset = parseInt(offset);
	limit = parseInt(limit);
	offset = isNaN(offset) || offset >= 100000 || offset < 0 ? 0 : offset;
	limit = isNaN(limit) || limit >= 50 || limit < 10 ? 20 : limit;

	const likedTarget = await req.spotifyApi.getLiked(
		type,
		offset,
		limit,
		after
	);
	const error = globalErrorHandler(
		"COULD_NOT_GET_LIKED_" + type.toUpperCase(),
		likedTarget
	);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: likedTarget } });
});

// Player Route

router.get("/player/currently-playing", async (req, res) => {
	const { additional_types } = req.query;
	const currentlyPlaying = await req.spotifyApi.getCurrentlyPlaying(
		additional_types
	);
	const error = globalErrorHandler(
		"COULD_NOT_GET_CURRENTLY_PLAYING",
		currentlyPlaying
	);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: currentlyPlaying } });
});

router.get("/player/devices", async (req, res) => {
	const devices = await req.spotifyApi.getDevices();
	const error = globalErrorHandler("COULD_NOT_GET_DEVICES_INFO", devices);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: devices } });
});

router.put("/player/transform-playback", async (req, res) => {
	const { play = true, deviceId = null } = req.query;

	const setTransfromPlayback = await req.spotifyApi.transformPlayback({
		play,
		deviceId: deviceId ? deviceId.split(",") : [],
	});
	const error = globalErrorHandler(
		"COULD_NOT_SET_TRNSFORM_PLAYBACK",
		setTransfromPlayback
	);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: setTransfromPlayback } });
});
router.put("/player/volume", async (req, res) => {
	const { volume_percent = "50" } = req.query;
	const changeVolume = await req.spotifyApi.setPlayerVolume(volume_percent);
	const error = globalErrorHandler("COULD_NOT_CHANGE_VOLUME", changeVolume);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: changeVolume } });
});
router.put("/player/seek", async (req, res) => {
	const { position_ms } = req.query;
	const playerSeek = await req.spotifyApi.playerSeekTo(position_ms);
	const error = globalErrorHandler("COULD_NOT_SEEK", playerSeek);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: playerSeek } });
});
router.put("/player/play", async (req, res) => {
	let { uris = "", context_uri = "", offset = "" } = req.query;

	uris = uris.split(",");

	const playerPlay = await req.spotifyApi.playerPlayPause("play", {
		uris,
		context_uri,
		offset,
	});
	const error = globalErrorHandler("COULD_NOT_PLAY", playerPlay);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: playerPlay } });
});
router.put("/player/pause", async (req, res) => {
	const playerPause = await req.spotifyApi.playerPlayPause("pause");
	const error = globalErrorHandler("COULD_NOT_PAUSE", playerPause);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: playerPause } });
});
router.put("/player/repeat", async (req, res) => {
	const { state } = req.query;
	console.log(state);
	const playerRepeat = await req.spotifyApi.playerRepeat(state);
	const error = globalErrorHandler("COULD_NOT_SET_REPEAT", playerRepeat);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: playerRepeat } });
});
router.put("/player/shuffle", async (req, res) => {
	const { state } = req.query;
	const playerShuffle = await req.spotifyApi.playerShuffle(state);
	const error = globalErrorHandler("COULD_NOT_SET_SHUFFLE", playerShuffle);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: playerShuffle } });
});
router.get("/player", async (req, res) => {
	const playerState = await req.spotifyApi.getPlayerState();
	const error = globalErrorHandler("COULD_NOT_GET_PLAYER_STATE", playerState);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: playerState } });
});
module.exports = router;
