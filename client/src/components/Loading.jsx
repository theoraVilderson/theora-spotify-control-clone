import { Rings } from "react-loader-spinner";

export function RingLoader(props) {
	return (
		<Rings
			{...{
				color: window
					.getComputedStyle(document.documentElement)
					.getPropertyValue("--text-bright-accent"),
				height: 100,
				width: 110,
				...{ ...props },
			}}
		/>
	);
}

export function RingCenterdLoader({ isLoaded, ...restProps }) {
	return !isLoaded ? (
		<div className="flex justify-center items-center">
			<RingLoader />
		</div>
	) : null;
}

function Loading() {
	return <div>Loading ...</div>;
}

export default Loading;
