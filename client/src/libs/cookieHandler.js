export const cookieHandler = {
	tld: true, // if true, set cookie domain at top level domain
	set: function (name, value, duration) {
		let cookie = { [name]: value, path: "/" };

		if (duration) {
			let date = new Date();
			date.setTime(date.getTime() + duration);
			cookie.expires = date.toUTCString();
		}

		if (this.tld) {
			cookie.domain =
				"." + window.location.hostname.split(".").slice(-2).join(".");
		}

		let arr = [];
		for (let key in cookie) {
			arr.push(`${key}=${cookie[key]}`);
		}
		document.cookie = arr.join("; ");

		return this.get(name);
	},

	getAll: function () {
		let cookie = {};
		document.cookie.split(";").forEach((el) => {
			let [k, v] = el.split("=");
			cookie[k.trim()] = v;
		});
		return cookie;
	},

	get: function (name) {
		return this.getAll()[name];
	},

	delete: function (name) {
		return this.set(name, "", -1);
	},
	clear: function () {
		Object.keys(this.getAll()).forEach((e) => this.delete(e));
	},
};
