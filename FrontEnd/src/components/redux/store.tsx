import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import dataReducer from "./data-slice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        data: dataReducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
