import axios from "axios";
import type { AuthResponseModel, UserModel } from "../models/user-model";
import { appConfig } from "../utils/app-config";
import { store } from "../redux/store";
import { login, logout, setUser } from "../redux/auth-slice";
import { clearData } from "../redux/data-slice";



class AuthService {

    //Login - Step 1 - random code to email
    public async requestCode(email: string): Promise<void> {
        await axios.post(appConfig.authUrl + "request-code", { email });
    }

    //Login - Step 2 - verify code (token for 12 hours)
    public async verifyCode(email: string, code: string): Promise<AuthResponseModel> {
        const response = await axios.post<AuthResponseModel>(appConfig.authUrl + "verify-code", { email, code });
        store.dispatch(login(response.data));
        return response.data;
    }

    //Refresh current user (role may have changed)
    public async refreshMe(): Promise<UserModel> {
        const response = await axios.get<UserModel>(appConfig.authUrl + "me");
        store.dispatch(setUser(response.data));
        return response.data;
    }

    //Logout
    public async logout(): Promise<void> {
        store.dispatch(logout());
        store.dispatch(clearData());
        await axios.post(appConfig.authUrl + "logout").catch(() => undefined);
    }

}

export const authService = new AuthService();
