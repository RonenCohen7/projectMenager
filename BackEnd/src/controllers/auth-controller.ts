import express, { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth-service";
import { loginCodeLimiter } from "../middleware/rate-limit-middleware";
import { verifyToken } from "../middleware/verify-token";
import { appConfig } from "../utils/app-config";


class AuthController {

    public readonly router = express.Router();


    public constructor() {
        this.router.post("/api/auth/request-code", loginCodeLimiter, this.requestCode);
        this.router.post("/api/auth/verify-code", loginCodeLimiter, this.verifyCode);
        this.router.get("/api/auth/me", verifyToken, this.me);
        this.router.post("/api/auth/logout", this.logout);
    }


    //Login - Step 1 - Send random code to email
    private async requestCode(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            await authService.requestCode(request.body?.email);

            response.json({ message: "הקוד נשלח למייל" });

        } catch (err) {
            next(err)
        }
    }


    //Login - Step 2 - Verify code -> token for 12 hours
    private async verifyCode(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { email, code } = request.body ?? {};

            const auth = await authService.verifyCode(email, code);

            response.cookie("accessToken", auth.token, {
                httpOnly: true,
                secure: appConfig.isProduction,
                sameSite: "lax",
                maxAge: appConfig.jwtExpiresHours * 60 * 60 * 1000
            });

            response.json(auth);

        } catch (err) {
            next(err)
        }
    }


    //Current user
    private async me(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const user = await authService.getActiveUser(request.user!.idUser);

            response.json(user);

        } catch (err) {
            next(err)
        }
    }


    //Logout
    private async logout(request: Request, response: Response, next: NextFunction): Promise<void> {
        response.clearCookie("accessToken");
        response.sendStatus(204);
    }

}


export const authController = new AuthController();
