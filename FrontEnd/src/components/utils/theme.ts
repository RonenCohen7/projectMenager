import { createTheme } from "@mui/material/styles";

//MUI theme - colors match the css variables in index.css
export const theme = createTheme({
    direction: "rtl",
    palette: {
        primary: { main: "#4F46E5", contrastText: "#FFFFFF" },
        secondary: { main: "#0891B2" },
        error: { main: "#9B2C2C" },
        warning: { main: "#9A5B00" },
        success: { main: "#1D7A4C" },
        background: { default: "#F4F6FA", paper: "#FFFFFF" },
        text: { primary: "#0F1B2A", secondary: "#5B6B7A" },
        divider: "#E2E8F0"
    },
    shape: { borderRadius: 10 },
    typography: {
        fontFamily: "Rubik, \"Segoe UI\", Arial, sans-serif",
        fontSize: 14,
        button: { textTransform: "none", fontWeight: 600 }
    },
    components: {
        MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
        MuiSelect: { defaultProps: { size: "small" } },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { borderRadius: 10, fontWeight: 600, paddingInline: 16 } }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: { borderRadius: 10, backgroundColor: "#FFFFFF" },
                notchedOutline: { borderColor: "#E2E8F0" }
            }
        },
        MuiDialog: { styleOverrides: { paper: { borderRadius: 18 } } },
        MuiDialogTitle: { styleOverrides: { root: { fontWeight: 800, fontSize: 20 } } },
        MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, minHeight: 48 } } },
        MuiToggleButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, paddingInline: 12 } } },
        MuiTableCell: {
            styleOverrides: {
                head: { fontWeight: 600, fontSize: 12.5, color: "#5B6B7A", backgroundColor: "#F8FAFC" },
                root: { borderColor: "#EEF2F7" }
            }
        },
        MuiMenu: { styleOverrides: { paper: { borderRadius: 12, boxShadow: "0 16px 40px rgba(15,27,42,.14)" } } },
        MuiTooltip: { defaultProps: { arrow: true } }
    }
});
