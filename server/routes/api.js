const express = require("express");
const router = express.Router();

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

router.get("/playlist/:playListId", (req, res) => {
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

		const follow = await req.spotifyApi.unFollow(artistId, "artist");
		const error = globalErrorHandler("COULD_NOT_UNFOLLOW", follow);

		if (error) {
			return res.json(error);
		}

		return res.json({ status: true, data: { result: follow } });
	});

module.exports = router;
