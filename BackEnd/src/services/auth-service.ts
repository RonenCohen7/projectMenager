import crypto from "crypto";
import jwt from "jsonwebtoken";

import { dal } from "../utils/dal";
import { appConfig } from "../utils/app-config";
import { isEmail, sanitizeText } from "../utils/sanitize";
import { mailService } from "./mail-service";
import { ValidationError, UnauthorizedError, ResourceNotFoundError } from "../models/client-errors";
import { LoginResult, UserModel } from "../models/user-model";
import { securityLog } from "../utils/security-log";
import { Request } from "express";
import { userService } from "./users-service";


const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

type PendingCode = {
    idUser: number;
    codeHash: string;
    expiresAt: number;
    sentAt: number;
    attempts: number;
};


class AuthService {

    // In-memory: codes are lost on backend restart (the user simply requests a new one).
    private pendingCodes = new Map<string, PendingCode>();


    private hashCode(email: string, code: string): string {
        return crypto
            .createHmac("sha256", appConfig.jwtSecret)
            .update(`${email}:${code}`)
            .digest("hex");
    }


    private cleanEmail(email: string): string {
        return sanitizeText(String(email ?? "")).toLowerCase();
    }


    // ============================================================
    // STEP 1 - SEND RANDOM CODE TO EMAIL (no password)
    // ============================================================
    //Same answer for registered / unknown email - the answer does not reveal who is a user
    public async requestCode(email: string, request: Request): Promise<void> {

        const cleanEmail = this.cleanEmail(email);

        if (!isEmail(cleanEmail)) {
            throw new ValidationError("יש להזין כתובת מייל תקינה");
        }

        const sql = `
            SELECT
                id_user AS idUser,
                first_name AS firstName
            FROM users
            WHERE email = ?
            AND is_active = TRUE
        `;

        const users = await dal.execute(sql, [cleanEmail]) as { idUser: number, firstName: string }[];
        const user = users[0];

        if (!user) {
            securityLog("login_code_unknown_email", request, { email: cleanEmail });
            return;
        }

        const existing = this.pendingCodes.get(cleanEmail);
        if (existing && Date.now() - existing.sentAt < RESEND_COOLDOWN_MS) {
            securityLog("login_code_cooldown", request, { email: cleanEmail });
            return;
        }

        const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

        this.pendingCodes.set(cleanEmail, {
            idUser: user.idUser,
            codeHash: this.hashCode(cleanEmail, code),
            expiresAt: Date.now() + CODE_TTL_MS,
            sentAt: Date.now(),
            attempts: 0
        });

        securityLog("login_code_requested", request, { email: cleanEmail, idUser: user.idUser });

        if (!mailService.isConfigured() && appConfig.isDevelopment) {
            console.log(`[DEV] Login code for ${cleanEmail}: ${code}`);
            return;
        }

        try {
            await mailService.send(
                cleanEmail,
                "מעקב פרויקטים - קוד כניסה",
                this.buildHtml(user.firstName, code),
                `שלום ${user.firstName},\nקוד הכניסה שלך: ${code}\nהקוד בתוקף ל-10 דקות.\nאם לא ניסית להתחבר, אפשר להתעלם מהמייל.`
            );
        } catch (err) {
            this.pendingCodes.delete(cleanEmail);
            throw err;
        }
    }


    // ============================================================
    // STEP 2 - VERIFY CODE -> JWT FOR 12 HOURS
    // ============================================================
    public async verifyCode(email: string, code: string, request: Request): Promise<LoginResult> {

        const cleanEmail = this.cleanEmail(email);
        const cleanCode = String(code ?? "").trim();

        const pending = this.pendingCodes.get(cleanEmail);

        if (!pending || pending.expiresAt < Date.now()) {
            this.pendingCodes.delete(cleanEmail);
            securityLog("login_failed", request, { email: cleanEmail, reason: pending ? "code_expired" : "no_code" });
            throw new UnauthorizedError("הקוד פג תוקף, בקשו קוד חדש");
        }

        pending.attempts++;

        const expected = Buffer.from(pending.codeHash, "hex");
        const actual = Buffer.from(this.hashCode(cleanEmail, cleanCode), "hex");

        if (!crypto.timingSafeEqual(expected, actual)) {
            if (pending.attempts >= MAX_ATTEMPTS) {
                this.pendingCodes.delete(cleanEmail);
                securityLog("login_locked", request, { email: cleanEmail, idUser: pending.idUser, attempts: pending.attempts });
                throw new UnauthorizedError("יותר מדי ניסיונות, בקשו קוד חדש");
            }
            securityLog("login_failed", request, { email: cleanEmail, idUser: pending.idUser, reason: "wrong_code", attempts: pending.attempts });
            throw new ValidationError("הקוד שגוי");
        }

        this.pendingCodes.delete(cleanEmail);

        const user = await this.getActiveUser(pending.idUser);

        const versions = await dal.execute(`SELECT token_version AS tv FROM users WHERE id_user = ?`, [user.idUser]) as { tv: number }[];

        const token = jwt.sign(
            { idUser: user.idUser, tv: versions[0]?.tv ?? 0 },
            appConfig.jwtSecret,
            { algorithm: "HS256", expiresIn: `${appConfig.jwtExpiresHours}h` }
        );

        securityLog("login_success", request, { email: cleanEmail, idUser: user.idUser });

        return { token, user, expiresAt: Date.now() + appConfig.jwtExpiresHours * 60 * 60 * 1000 };
    }


    //Logout - raises the token version: every token of the user (all devices) stops working
    public async revokeTokens(idUser: number): Promise<void> {
        await dal.execute(`UPDATE users SET token_version = token_version + 1 WHERE id_user = ?`, [idUser]);
    }


    //Current user
    public async getActiveUser(idUser: number): Promise<UserModel> {
        const user = await userService.getOneUser(idUser);
        if (!user.isActive) {
            throw new ResourceNotFoundError(idUser);
        }
        return user;
    }


    private buildHtml(firstName: string, code: string): string {
        return `
            <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; color: #16212C;">
                <h2>מעקב פרויקטים</h2>
                <p>שלום ${sanitizeText(firstName)},</p>
                <p>קוד הכניסה שלך למערכת:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 16px 0;">${code}</p>
                <p>הקוד בתוקף ל-10 דקות.</p>
                <p style="color: #5B6B7A;">אם לא ניסית להתחבר, אפשר להתעלם מהמייל.</p>
            </div>
        `;
    }

}


export const authService = new AuthService();
