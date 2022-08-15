import "./App.css";
import { useState, useEffect } from "react";
// Import React FilePond
import { registerPlugin } from "react-filepond";

// Import FilePond styles
import "filepond/dist/filepond.min.css";

// Import the Image EXIF Orientation and Image Preview plugins
// Note: These need to be installed separately
// `npm i filepond-plugin-image-preview filepond-plugin-image-exif-orientation --save`
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginImageResize from "filepond-plugin-image-resize";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";

import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";

import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

import Loading from "./components/Loading";

import { useGlobalContext } from "./context/globalContext";
import { actionTypes } from "./reducer/globalReducer";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import AfterLogin from "./pages/AfterLogin/AfterLogin";

import { cookieHandler } from "./libs/cookieHandler";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import useFetcher from "./hooks/fetcher";

// Register the plugins
registerPlugin(
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview,
  FilePondPluginImageResize,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

function App() {
  const [loadingDone, setLoadingDone] = useState(false);
  const [globalData, dispatch] = useGlobalContext();
  const {
    tokens: { accessToken },
  } = globalData;
  const fetcher = useFetcher([globalData, dispatch]);
  useEffect(() => {
    (async () => {
      let accessToken = cookieHandler.get("accessToken");
      let refreshToken = cookieHandler.get("refreshToken");
      if (!accessToken && !refreshToken) {
        setLoadingDone(true);
        return;
      }
      if (!accessToken || !refreshToken) {
        const tokens = await fetcher("/api/updateTokens");

        accessToken = tokens.data.result.accessToken;
        refreshToken = tokens.data.result.refreshToken;
      }

      dispatch({
        type: actionTypes.SET_TOKENS,
        payload: { accessToken, refreshToken },
      });

      setLoadingDone(true);
    })();
  }, [accessToken]);
  useEffect(() => {
    let loginChallange = cookieHandler.get("loginChallange");

    if (loginChallange) {
      dispatch({
        type: actionTypes.SET_LOGIN_CHALLANGE,
        payload: loginChallange,
      });
    }
  }, [accessToken]);

  useEffect(() => {
    console.log(globalData);
  }, [globalData]);

  const Page = accessToken ? Home : Login;

  return (
    <div className="App">
      {!loadingDone ? (
        <Loading />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path={"/callback"} element={<AfterLogin />} />
            <Route path={"/Search"} element={<Page feedType={"Search"} />} />
            <Route
              path={"/LikedArtists"}
              element={<Page feedType={"LikedArtists"} />}
            />
            <Route
              path={"/LikedAlbums"}
              element={<Page feedType={"LikedAlbums"} />}
            />
            <Route
              path={"/LikedPodcasts"}
              element={<Page feedType={"LikedPodcasts"} />}
            />
            <Route
              path={"/LikedSongs"}
              element={<Page feedType={"LikedSongs"} />}
            />
            <Route
              path="/playlist/:playlistId"
              element={<Page feedType={"Playlist"} />}
            />
            <Route
              path="/album/:albumId"
              element={<Page feedType={"Album"} />}
            />
            <Route
              path="/track/:trackId"
              element={<Page feedType={"Track"} />}
            />
            <Route
              path="/artist/:artistId"
              element={<Page feedType={"Artist"} />}
            />
            <Route
              path="/artist/:artistId/:subMenuName"
              element={<Page feedType={"Artist"} />}
            />
            <Route path="/user/:userId" element={<Page feedType={"User"} />} />
            <Route path="/show/:showId" element={<Page feedType={"Show"} />} />
            <Route
              path="/episode/:episodeId"
              element={<Page feedType={"Episode"} />}
            />

            <Route path="*" element={<Page feedType={"Suggestion"} />} />
          </Routes>
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;
