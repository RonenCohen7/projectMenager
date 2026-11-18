import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { appConfig } from "../utils/app-config";
import { dal } from "../utils/dal";
import { TokenUser } from "../models/user-model";


//Reads the JWT (Bearer header or cookie) and checks the user is still active (role is taken from the DB)
export async function verifyToken(request: Request, response: Response, next: NextFunction): Promise<void> {

    const authorization = request.header("authorization");

    let token: string | undefined;

    if (authorization) {
        const [scheme, rawToken] = authorization.trim().split(/\s+/);
        if (scheme === "Bearer" && rawToken) {
            token = rawToken;
        }
    }

    if (!token) {
        token = request.cookies?.accessToken;
    }

    if (!token) {
        response.sendStatus(401);
        return;
    }

    try {
        const payload = jwt.verify(token, appConfig.jwtSecret) as { idUser: number };

        const sql = `
            SELECT
                id_user AS idUser,
                role
            FROM users
            WHERE id_user = ?
            AND is_active = TRUE
        `;

        const users = await dal.execute(sql, [payload.idUser]) as TokenUser[];

        if (!users[0]) {
            response.sendStatus(401);
            return;
        }

        request.user = users[0];
        next();
    }
    catch (err: any) {
        response.sendStatus(401);
    }
}
