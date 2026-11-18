import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import type { AuthResponseModel, UserModel } from "../models/user-model";


export interface AuthState {
    token: string | null;
    user: UserModel | null;
}


//Token is valid 12 hours - expired token is ignored
function loadToken(): string | null {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const { exp } = jwtDecode<{ exp: number }>(token);
        return exp * 1000 > Date.now() ? token : null;
    } catch {
        return null;
    }
}

const token = loadToken();
const storedUser = localStorage.getItem("user");

const initialState: AuthState = {
    token,
    user: token && storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null
};

const authSlice = createSlice({
    name: "auth",
    initialState,

    reducers: {
        login(state, action: PayloadAction<AuthResponseModel>) {
            state.token = action.payload.token;
            state.user = action.payload.user;

            localStorage.setItem("token", action.payload.token);
            localStorage.setItem("user", JSON.stringify(action.payload.user));
        },
        setUser(state, action: PayloadAction<UserModel>) {
            state.user = action.payload;
            localStorage.setItem("user", JSON.stringify(action.payload));
        },
        logout(state) {
            state.token = null;
            state.user = null;

            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
    }
});

export const { login, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
