import { Link } from "react-router-dom";

function LinkWithBorder({ children, className, isNeedSpace, ...rest }) {
	return (
		<Link
			className={`border-b break-all hover:border-current border-solid border-transparent font-bold activeColor ${
				isNeedSpace ? "mx-1" : "mr-1"
			}`}
			{...rest}
		>
			{children}
		</Link>
	);
}

export default LinkWithBorder;
