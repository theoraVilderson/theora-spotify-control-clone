export const helper = {
	getHighSizeImage: (images) => {
		const targetImage = images?.reduce?.((e, n) => {
			e.width = e.width ?? 0;
			e.height = e.height ?? 0;

			return e.width + e.height <= n.width + n.height ? n : e;
		}, {});
		return targetImage?.url;
	}, // if true, set cookie domain at top level domain
	apiErrorHandler(e) {
		const serverError = e?.data?.error;

		let error = "Error (please refresh page if automatically not fixed)";

		if (serverError == null) return error;

		if (!serverError.toLowerCase().includes("token")) {
			error = " Item Not Found ";
		}

		return error;
	},
};
