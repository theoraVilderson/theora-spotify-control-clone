import "./App.css";
import { useState, useEffect } from "react";
import Loading from "./components/Loading";

import { useGlobalContext } from "./context/globalContext";
import { actionTypes } from "./reducer/globalReducer";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import AfterLogin from "./pages/AfterLogin/AfterLogin";

import { cookieHandler } from "./libs/cookieHandler";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import useFetcher from "./hooks/fetcher";
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
