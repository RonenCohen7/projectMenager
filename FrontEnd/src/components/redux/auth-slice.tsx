import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponseModel, UserModel } from "../models/user-model";


//The token itself is only in an httpOnly cookie (JavaScript cannot read it - safe from XSS).
//Here: who is logged in and until when (12 hours) - not secret.
export interface AuthState {
    expiresAt: number | null;
    user: UserModel | null;
}


function loadSession(): AuthState {
    try {
        const expiresAt = Number(localStorage.getItem("expiresAt"));
        const storedUser = localStorage.getItem("user");
        if (expiresAt > Date.now() && storedUser && storedUser !== "undefined") {
            return { expiresAt, user: JSON.parse(storedUser) };
        }
    } catch {
        //storage not available
    }
    localStorage.removeItem("token"); //older version kept the token here
    return { expiresAt: null, user: null };
}

const initialState: AuthState = loadSession();

const authSlice = createSlice({
    name: "auth",
    initialState,

    reducers: {
        login(state, action: PayloadAction<AuthResponseModel>) {
            state.expiresAt = action.payload.expiresAt;
            state.user = action.payload.user;

            localStorage.setItem("expiresAt", String(action.payload.expiresAt));
            localStorage.setItem("user", JSON.stringify(action.payload.user));
        },
        setUser(state, action: PayloadAction<UserModel>) {
            state.user = action.payload;
            localStorage.setItem("user", JSON.stringify(action.payload));
        },
        logout(state) {
            state.expiresAt = null;
            state.user = null;

            localStorage.removeItem("expiresAt");
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        }
    }
});

export const { login, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
