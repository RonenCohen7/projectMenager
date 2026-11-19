import express, { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth-service";
import { loginCodeLimiter } from "../middleware/rate-limit-middleware";
import { readToken, resolveToken, verifyToken } from "../middleware/verify-token";
import { securityLog } from "../utils/security-log";
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
            await authService.requestCode(request.body?.email, request);

            response.json({ message: "אם המייל רשום במערכת, נשלח אליו קוד כניסה" });

        } catch (err) {
            next(err)
        }
    }


    //Login - Step 2 - Verify code -> token for 12 hours
    private async verifyCode(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { email, code } = request.body ?? {};

            const auth = await authService.verifyCode(email, code, request);

            //Token only in an httpOnly cookie - JavaScript (and XSS) cannot read it.
            //secure when the site is served over HTTPS (X-Forwarded-Proto from nginx)
            response.cookie("accessToken", auth.token, {
                httpOnly: true,
                secure: request.secure,
                sameSite: "strict",
                path: "/api",
                maxAge: appConfig.jwtExpiresHours * 60 * 60 * 1000
            });

            response.json({ user: auth.user, expiresAt: auth.expiresAt });

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


    //Logout - the token is revoked on the server (not only deleted from the browser)
    private async logout(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const token = readToken(request);
            if (token) {
                const result = await resolveToken(token);
                if ("user" in result) {
                    await authService.revokeTokens(result.user.idUser);
                    request.user = result.user;
                    securityLog("logout", request);
                }
            }

            response.clearCookie("accessToken", { path: "/api" });
            response.sendStatus(204);

        } catch (err) {
            next(err)
        }
    }

}


export const authController = new AuthController();
