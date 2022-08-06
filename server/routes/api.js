const express = require("express");
const router = express.Router();
const lyricsFinder = require("lyrics-finder");
// check if user live

async function isUserLive(req) {
	let res = null;
	try {
		res = await req.spotifyApi.getMe();
	} catch (e) {
		res = e;
	}
	console.log("isUserLive", res);
	return true;
}

function reviveUser(req, accessToken, refreshToken) {}
function globalErrorHandler(defaultError, data) {
	if (!Object.keys(data).length)
		return {
			status: true,
			data: { error: defaultError },
		};
	else if (data.error) {
		return {
			status: true,
			data: { error: data.error },
		};
	}
	return null;
}
function isUserLoggedIn(req) {
	return !!req.cookies.accessToken;
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

// if routes that need tokens
router.use("*", (req, res, next) => {
	if (!req.cookies.accessToken)
		return res.json({ status: true, data: { error: "INVALID_TOKEN" } });

	req.spotifyApi.setToken(req.cookies.accessToken);

	return next();
});

router.get("/user", async (req, res) => {
	const userInfo = await req.spotifyApi.getMe();
	const error = globalErrorHandler("COULD_NOT_GET_USER_INFO", userInfo);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: userInfo } });
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

router.get("/suggestions", async (req, res) => {
	const suggestions = await req.spotifyApi.getSuggestions();
	const error = globalErrorHandler("COULD_NOT_GET_SUGGESTIONS", suggestions);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: suggestions } });
});

// PlayList Route
router.get("/playlists", async (req, res) => {
	let { userId, offset = 0, limit = 20 } = req.query;

	if (!userId) return res.json(globalErrorHandler("please pass userId", {}));

	offset = parseInt(offset);
	limit = parseInt(limit);
	offset = isNaN(offset) || offset >= 100000 || offset < 0 ? 0 : offset;
	limit = isNaN(limit) || limit >= 50 || limit < 0 ? 20 : limit;

	const userInfo = await req.spotifyApi.getPlayLists(userId, offset, limit);
	const error = globalErrorHandler("COULD_NOT_GET_USER_PLAYLISTS", userInfo);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: userInfo } });
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
	const { offset = 0, limit = 20 } = req.query;
	const playlistFullInfo = await req.spotifyApi.getFullyPlayList(
		playlistId,
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
	.route("/playlist/follow/:playlistId")
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
	.route("/artist/follow/:artistId")
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
// Album Route

router
	.route("/album/like/:albumId")
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

// Track Route
router
	.route("/track/like/:trackId")
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

	const lyrics = (await lyricsFinder(artists, name)) || {
		error: "COULD_NOT_FIND_LYRICS",
	};
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
	.route("/episode/like/:episodeId")
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
// Player Route

router.get("/player/currently-playing", async (req, res) => {
	const { additional_types } = req.query;
	const currentlyPlaying = await req.spotifyApi.getCurrentlyPlaying(
		additional_types
	);
	console.log({ currentlyPlaying });
	const error = globalErrorHandler(
		"COULD_NOT_GET_CURRENTLY_PLAYING",
		currentlyPlaying
	);

	if (error) {
		return res.json(error);
	}

	return res.json({ status: true, data: { result: currentlyPlaying } });
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
	let { uris = [], context_uri = "", offset = "" } = req.query;

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
