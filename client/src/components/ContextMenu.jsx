import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

import { styled } from "@mui/material/styles";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";

import { useEffect, useState } from "react";

const HtmlTooltip = styled(({ className, ...props } = {}) => (
	<Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
	[`& .${tooltipClasses.tooltip}`]: {
		backgroundColor: "#000",
		maxWidth: "250px",
		minWidth: "100px",
		width: "30vw",
		fontSize: theme.typography.pxToRem(12),
	},
}));

function ContextMenu({
	type,
	clickable = false,
	children,
	menuItems = [],
	...rest
}) {
	const [contextMenu, setContextMenu] = useState(null);

	const handleContextMenu = (event) => {
		event.preventDefault();
		setContextMenu(
			contextMenu === null
				? {
						mouseX: event.clientX + 2,
						mouseY: event.clientY - 6,
				  }
				: // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
				  // Other native context menus might behave different.
				  // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
				  null
		);
	};

	const handleCloseContextMenu = (action = async () => {}) => {
		return async (...args) => {
			typeof action === "function" && (await action(...args));
			setContextMenu(null);
		};
	};

	const actionProerty = {};
	actionProerty[clickable ? "onClick" : "onContextMenu"] = handleContextMenu;

	return (
		<div {...rest} {...actionProerty}>
			{!menuItems.length ? null : (
				<Menu
					open={contextMenu !== null}
					onClose={handleCloseContextMenu()}
					anchorReference="anchorPosition"
					anchorPosition={
						contextMenu !== null
							? {
									top: contextMenu.mouseY,
									left: contextMenu.mouseX,
							  }
							: undefined
					}
					sx={{
						"& ul,& li": {
							color: "var(--text-base)",
							backgroundColor: "var(--background-base)",
						},
						"& ul": {
							padding: "0",
						},
						"& li:hover": {
							backgroundColor: "rgba(255,255,255,.3)",
						},
					}}
				>
					{menuItems.map((e, k) => {
						return !e.active || !e.type.includes(type) ? (
							<div key={k}></div>
						) : (
							<MenuItem
								key={k}
								onClick={
									e.actionType !== "submenu"
										? handleCloseContextMenu(e.action)
										: () => {}
								}
								className="activeColor activeBgColor"
							>
								{e.actionType !== "submenu" ? (
									<button className="flex w-full h-full items-center ">
										{e.title}
									</button>
								) : (
									<HtmlTooltip
										placement="right"
										className="activeColor activeBgColor"
										title={e.submenu(
											handleCloseContextMenu
										)}
									>
										<button className="flex w-full h-full items-center ">
											{e.title}
										</button>
									</HtmlTooltip>
								)}
							</MenuItem>
						);
					})}
				</Menu>
			)}

			{children}
		</div>
	);
}

export function ContextSubmenu({ item }) {}
export default ContextMenu;
