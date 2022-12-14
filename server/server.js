const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const path = require("path");
var cookieParser = require("cookie-parser");

const isOnBuild = process.env.ENV != "development";

const SpotifyApi = require("./lib/spotifyApi");

/// if we are on build we need to do this for static assets

if (isOnBuild) {
	app.use(express.static(path.resolve(__dirname, "../client/build")));
} else {
	require("dotenv").config();
}

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiRouter = require("./routes/api");

app.use(
	"/api",
	(req, res, next) => {
		req.spotifyApi = new SpotifyApi({
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
		});

		return next();
	},
	apiRouter
);

if (isOnBuild) {
	app.use((req, res, next) => {
		res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
	});
}

app.listen(port, () => console.log(`server is up on port ${port}`));
