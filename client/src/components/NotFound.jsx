function NotFound({ show = true, text = "NOT FOUND ANY RESULT", ...rest }) {
	return !show ? (
		<></>
	) : (
		<div {...rest}>
			<h1 className="flex justify-center items-center ">{text}</h1>
		</div>
	);
}

export default NotFound;
