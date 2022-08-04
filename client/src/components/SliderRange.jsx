import { Range, getTrackBackground } from "react-range";
import { useState, useEffect, useMemo } from "react";

function SliderRange({
	onSliderChange = () => {},
	onSliderChangeLastHit = () => {},
	step = 0.1,
	min = 0,
	max = 100,
	width = "150px",
	defaultValues = [50],
	disabled = false,
	onSliderDone = () => {},
	onSliderStart = () => {},
	updateOnDefaultChange = true,
}) {
	defaultValues = useMemo(() => {
		return defaultValues;
	}, [defaultValues]);

	const [values, setValues] = useState(defaultValues);

	const [timer, setTimer] = useState(null);

	// useEffect(() => {
	// 	onSliderChange(values);
	// }, [values]);

	useEffect(() => {
		if (!updateOnDefaultChange) return;
		setValues(defaultValues);
	}, [defaultValues]);

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
				step={step}
				min={min}
				max={max}
				disabled={disabled}
				onChange={(values) => {
					setValues(values);
					onSliderChange(values);

					if (timer) {
						clearTimeout(timer);
					}
					setTimer(
						setTimeout(() => {
							onSliderChangeLastHit(values);
						}, 500)
					);
				}}
				renderTrack={({ props, children }) => (
					<div
						onMouseDown={function (e) {
							props.onMouseDown.bind(this)(e);
							onSliderStart(values, e);
						}}
						onTouchStart={function (e) {
							props.onTouchStart.bind(this)(e);
							onSliderStart(values, e);
						}}
						onMouseUp={function (e) {
							props?.onMouseUp?.(e);
							onSliderDone(values);
						}}
						onTouchEnd={function (e) {
							props?.onTouchEnd?.(e);
							onSliderDone(values);
						}}
						style={{
							...props.style,
							height: "10px",
							display: "flex",
							width: width,
						}}
					>
						<div
							ref={props.ref}
							style={{
								height: "5px",
								width: width,
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
									min: min,
									max: max,
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

export default SliderRange;
