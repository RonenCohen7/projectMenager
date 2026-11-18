import { createTheme } from "@mui/material/styles";

//MUI theme - colors match the css variables in index.css
export const theme = createTheme({
    direction: "rtl",
    palette: {
        primary: { main: "#1E5B7A", contrastText: "#FFFFFF" },
        secondary: { main: "#7A4BB0" },
        error: { main: "#9B2C2C" },
        warning: { main: "#9A5B00" },
        success: { main: "#1D7A4C" },
        background: { default: "#F3F5F7", paper: "#FFFFFF" },
        text: { primary: "#16212C", secondary: "#5B6B7A" },
        divider: "#D6DDE4"
    },
    shape: { borderRadius: 8 },
    typography: {
        fontFamily: "\"IBM Plex Sans Hebrew\", \"Segoe UI\", Arial, sans-serif",
        fontSize: 14,
        button: { textTransform: "none", fontWeight: 600 }
    },
    components: {
        MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
        MuiSelect: { defaultProps: { size: "small" } },
        MuiButton: { defaultProps: { disableElevation: true } },
        MuiTooltip: { defaultProps: { arrow: true } }
    }
});
