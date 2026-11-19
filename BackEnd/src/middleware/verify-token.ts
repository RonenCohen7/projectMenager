import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { appConfig } from "../utils/app-config";
import { dal } from "../utils/dal";
import { securityLog } from "../utils/security-log";
import { TokenUser } from "../models/user-model";


export interface TokenPayload {
    idUser: number;
    tv?: number; //token version - raised on logout, so older tokens stop working
}


//Token from the httpOnly cookie (browser) or a Bearer header (API tools)
export function readToken(request: Request): string | undefined {
    const authorization = request.header("authorization");

    if (authorization) {
        const [scheme, rawToken] = authorization.trim().split(/\s+/);
        if (scheme === "Bearer" && rawToken) {
            return rawToken;
        }
    }

    return request.cookies?.accessToken;
}


//Valid token of an active user, with the current token version -> user, otherwise the reason
export async function resolveToken(token: string): Promise<{ user: TokenUser } | { reason: string }> {

    let payload: TokenPayload;
    try {
        payload = jwt.verify(token, appConfig.jwtSecret, { algorithms: ["HS256"] }) as TokenPayload;
    } catch (err: any) {
        return { reason: err?.name === "TokenExpiredError" ? "expired" : "invalid" };
    }

    const sql = `
        SELECT
            id_user AS idUser,
            role,
            token_version AS tokenVersion
        FROM users
        WHERE id_user = ?
        AND is_active = TRUE
    `;

    const users = await dal.execute(sql, [payload.idUser]) as (TokenUser & { tokenVersion: number })[];
    const user = users[0];

    if (!user) return { reason: "inactive_user" };
    if ((payload.tv ?? 0) !== user.tokenVersion) return { reason: "revoked" };

    return { user: { idUser: user.idUser, role: user.role } };
}


//Reads the JWT and checks the user is still active and the token was not revoked (role is taken from the DB)
export async function verifyToken(request: Request, response: Response, next: NextFunction): Promise<void> {

    const token = readToken(request);

    if (!token) {
        response.sendStatus(401);
        return;
    }

    try {
        const result = await resolveToken(token);

        if ("reason" in result) {
            securityLog("auth_rejected", request, { reason: result.reason });
            response.sendStatus(401);
            return;
        }

        request.user = result.user;
        next();
    }
    catch (err) {
        next(err);
    }
}
