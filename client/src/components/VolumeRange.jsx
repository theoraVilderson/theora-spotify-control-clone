import { Range, getTrackBackground } from "react-range";
import { useState, useEffect } from "react";
const STEP = 0.1;
const MIN = 0;
const MAX = 100;

function VolumeRange() {
	const [values, setValues] = useState([50]);
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				flexWrap: "wrap",
			}}
		>
			<Range
				values={values}
				step={STEP}
				min={MIN}
				max={MAX}
				onChange={(values) => setValues(values)}
				renderTrack={({ props, children }) => (
					<div
						onMouseDown={props.onMouseDown}
						onTouchStart={props.onTouchStart}
						style={{
							...props.style,
							height: "10px",
							display: "flex",
							width: "150px",
						}}
					>
						<div
							ref={props.ref}
							style={{
								height: "5px",
								width: "150px",
								borderRadius: "4px",
								background: getTrackBackground({
									values,
									colors: [
										window
											.getComputedStyle(
												document.documentElement
											)
											.getPropertyValue(
												"--text-bright-accent"
											),
										window
											.getComputedStyle(
												document.documentElement
											)
											.getPropertyValue("--text-subdued"),
									],
									min: MIN,
									max: MAX,
								}),
								alignSelf: "center",
							}}
						>
							{children}
						</div>
					</div>
				)}
				renderThumb={({ props, isDragged }) => (
					<div
						{...props}
						style={{
							...props.style,
							height: "10px",
							width: "10px",
							borderRadius: "4px",
							backgroundColor: "#FFF",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							boxShadow: "0px 2px 6px #AAA",
							outline: "0",
						}}
					>
						<div
							style={{
								height: "5px",
								width: "5px",
								backgroundColor: "#CCC",
							}}
						/>
					</div>
				)}
			/>
		</div>
	);
}

export default VolumeRange;
