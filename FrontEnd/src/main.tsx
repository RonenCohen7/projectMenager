import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import axios from "axios";

import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "@mui/stylis-plugin-rtl";
import { CssBaseline, ThemeProvider } from "@mui/material";

import "react-toastify/dist/ReactToastify.css";
import "./index.css";

import { store } from "./components/redux/store";
import { logout } from "./components/redux/auth-slice";
import { theme } from "./components/utils/theme";
import { Layout } from "./components/layout-area/layout/layout";


//Token on every request, 401 -> back to login
axios.defaults.withCredentials = true;

axios.interceptors.request.use(config => {
    const token = store.getState().auth.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axios.interceptors.response.use(
    response => response,
    error => {
        if (error?.response?.status === 401 && store.getState().auth.token) {
            store.dispatch(logout());
        }
        return Promise.reject(error);
    }
);


//RTL for MUI
const rtlCache = createCache({
    key: "muirtl",
    stylisPlugins: [prefixer, rtlPlugin]
});


createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Provider store={store}>
            <CacheProvider value={rtlCache}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <BrowserRouter>
                        <Layout />
                    </BrowserRouter>
                </ThemeProvider>
            </CacheProvider>
        </Provider>
    </StrictMode>
);
