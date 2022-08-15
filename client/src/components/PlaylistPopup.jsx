import { useEffect, useState, useMemo, useReducer } from "react";
import { useGlobalContext } from "../context/globalContext";
import { actionTypes } from "../reducer/globalReducer";

import useFetcher from "../hooks/fetcher";

import { RingCenterdLoader } from "./Loading";

import { helper } from "../libs/helper";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import LoadingButton from "@mui/lab/LoadingButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { FilePond, File } from "react-filepond";
import { AiFillSave } from "@react-icons/all-files/ai/AiFillSave";
import Follow from "./Follow";

import "./PlaylistPopup.css";

function PlaylistPopup({
	playlist = null,
	total = 0,
	open,
	onChange,
	onSuccess,
}) {
	const [globalData, dispatch] = useGlobalContext();
	const { userInfo, playlists, activePlayList } = globalData;

	const fetcher = useFetcher([globalData, dispatch]);

	const [playListTotal, setPlayListTotal] = useState(total);
	const [isLoading, setIsLoading] = useState(false);

	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

	console.log(playlist);

	useEffect(() => {
		if (playListTotal !== total) setPlayListTotal(total);
	}, [total]);

	const showModal = () => {
		onChange(true);
	};

	const handleOk = (newplaylist) => {
		onSuccess(newplaylist);
		handleCancel();
	};

	const handleCancel = () => {
		dialogDispatch({
			type: "CLEAR",
		});
		onChange(false);
	};

	const perviousImage = useMemo(() => {
		return helper.getHighSizeImage(playlist?.images);
	}, [playlist]);

	const isUpdateType = !!playlist?.id;
	const [reducerData, dialogDispatch] = useReducer(
		(state, { type, payload }) => {
			switch (type) {
				case "SET_PLAYLIST_NAME":
					return { ...state, playlistName: payload };
				case "SET_PLAYLIST_DESCRIPTION":
					return { ...state, playlistDescription: payload };
				case "SET_PLAYLIST_IS_PUBLIC":
					return { ...state, isPublic: payload };
				case "SET_PLAYLIST_IS_COLLABORATIVE":
					return { ...state, isCollaborative: payload };
				case "SET_PLAYLIST_COVOR":
					return { ...state, playlistCover: payload };
				case "CLEAR":
					return {};
			}
		},
		{
			playlistName:
				playlist?.name ?? "My Playlist #" + (playListTotal + 1),
			playlistDescription: playlist?.description ?? "",
			isPublic: playlist?.public ?? false,
			isCollaborative: playlist?.collaborative ?? false,
			playlistCover: [],
		}
	);
	const {
		playlistCover,
		playlistName,
		playlistDescription,
		isPublic,
		isCollaborative,
	} = reducerData;

	const onErrorHandler = (e) => {
		console.error(e);
		alert("failed to create playlist please try again ");
	};
	const newPlaylistSubmit = (e) => {
		e.preventDefault();

		if (isLoading) return;
		setIsLoading(true);
		const { playlistCover, ...rest } = reducerData;
		const formData = new FormData();

		Object.keys(rest).forEach((e) => {
			const val = rest[e];
			formData.append(e, val);
		});
		if (playlistCover[0])
			formData.append("playlistCover", playlistCover[0].source);

		const query =
			`?userId=${userInfo.id}` +
			(playlist?.id ? "&id=" + playlist?.id : "");

		fetcher("/api/playlist" + query, {
			method: playlist?.id ? "PUT" : "POST",
			body: formData,
		})
			.then((res) => {
				if (res.data.error) {
					onErrorHandler(res.data.error);
					return;
				}

				console.log("handleOk");
				handleOk(res.data.result);
			})
			.catch(onErrorHandler)
			.finally(() => {
				setIsLoading(false);
			});
	};

	return (
		<Dialog
			fullScreen={fullScreen}
			maxWidth={"sm"}
			fullWidth
			open={open}
			onClose={handleCancel}
			aria-labelledby="responsive-dialog-title"
			scroll={"paper"}
		>
			<form
				action="/api/playlist"
				method="post"
				encType="multipart/form-data"
				onSubmit={newPlaylistSubmit}
			>
				<DialogTitle id="responsive-dialog-title">
					{"Create New PlayList ?"}
				</DialogTitle>
				<DialogContent>
					<div className="flex flex-col gap-2 sm:flex-row w-full">
						<div className="flex flex-col w-1/2">
							<TextField
								autoFocus
								margin="dense"
								id="playListName"
								label="PlayList Name"
								type="text"
								fullWidth
								variant="standard"
								name="playlistName"
								value={playlistName}
								onChange={(e) =>
									dialogDispatch({
										type: "SET_PLAYLIST_NAME",
										payload: !e.target.value.trim()
											? ""
											: e.target.value,
									})
								}
								required
							/>

							<TextField
								margin="dense"
								id="playListDescription"
								label="PlayList Description"
								type="text"
								multiline
								rows={4}
								fullWidth
								variant="standard"
								name="playlistDescription"
								value={playlistDescription}
								onChange={(e) =>
									dialogDispatch({
										type: "SET_PLAYLIST_DESCRIPTION",
										payload: e.target.value,
									})
								}
							/>
						</div>
						<div className="w-1/2 h-64 p-2">
							<FilePond
								files={playlistCover}
								onupdatefiles={(newFiles) =>
									dialogDispatch({
										type: "SET_PLAYLIST_COVOR",
										payload: newFiles,
									})
								}
								allowMultiple={false}
								storeAsFile
								maxFiles={1}
								acceptedFileTypes={["image/png", "image/jpeg"]}
								maxFileSize={"100KB"}
								imageResizeTargetWidth={100}
								imageResizeTargetHeight={100}
								stylePanelAspectRatio={"1:1"}
								name="playlistCover"
								className="w-full h-64"
								labelIdle={`<div
										class='filepond--label-action p-2 bg-no-repeat bg-cover absolute left-0 bottom-0 top-0 w-full h-full flex justify-center items-center'
										style="background-image:url('${perviousImage}');"
										><div style="${
											perviousImage
												? "background-color:rgba(0,0,0,.3);color:white;"
												: ""
										}">Playlist Cover Drag & Drop your files or Browse</div></div>`}
							/>
						</div>
					</div>
				</DialogContent>

				<DialogActions className=" bg-white sticky bottom-0">
					<div className="flex w-full flex-wrap  justify-center sm:justify-between items-center">
						<div>
							<FormControl component="fieldset">
								<FormGroup
									aria-label="position"
									row
									className="items-center"
								>
									<FormControlLabel
										control={
											<Checkbox
												name="isPublic"
												onChange={(e) => {
													dialogDispatch({
														type: "SET_PLAYLIST_IS_PUBLIC",
														payload:
															e.target.checked,
													});

													if (isCollaborative)
														dialogDispatch({
															type: "SET_PLAYLIST_IS_COLLABORATIVE",
															payload: false,
														});
												}}
												checked={isPublic}
											/>
										}
										label="is Public"
										labelPlacement="end"
									/>
									<FormControlLabel
										control={
											<Checkbox
												name="isCollaborative"
												onChange={(e) => {
													dialogDispatch({
														type: "SET_PLAYLIST_IS_COLLABORATIVE",
														payload:
															e.target.checked,
													});
													if (isPublic)
														dialogDispatch({
															type: "SET_PLAYLIST_IS_PUBLIC",
															payload: false,
														});
												}}
												checked={isCollaborative}
											/>
										}
										label="is collaborative"
										labelPlacement="end"
									/>
									{isUpdateType ? (
										<Button
											variant="contained"
											color={"error"}
											component="span"
											className="flex w-10 h-8 justify-center items-center !p-0"
										>
											<Follow
												className=" inline-flex justify-center items-center w-full h-full"
												target={playlist}
												FollowContent={<>Follow</>}
												UnFollowContent={<>Delete</>}
												type="button"
												loaderProps={{
													width: 20,
													height: 20,
												}}
												onDone={() => {
													handleCancel();
												}}
											/>
										</Button>
									) : null}
								</FormGroup>
							</FormControl>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outlined"
								color={"error"}
								onClick={handleCancel}
								type="button"
							>
								Cancle
							</Button>

							<LoadingButton
								size="small"
								color={"success"}
								onClick={newPlaylistSubmit}
								loading={isLoading}
								loadingPosition="start"
								startIcon={<AiFillSave />}
								variant="contained"
								type="submit"
							>
								{isUpdateType ? "Update" : "Create"}
							</LoadingButton>
						</div>
					</div>
				</DialogActions>
			</form>
		</Dialog>
	);
}

export default PlaylistPopup;
