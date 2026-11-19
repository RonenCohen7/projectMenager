import { NextFunction, Request, Response } from "express";
import { RouteNotFoundError } from "../models/client-errors";

import { appConfig } from "../utils/app-config";
import { StatusCode } from "../enum/enum";
import { securityLog } from "../utils/security-log";


class ErrorMiddleware {

    public routeNotFound(request: Request, response: Response, next: NextFunction) {
        next(new RouteNotFoundError(request.originalUrl));
    }


    public catchAll(err: any, request: Request, response: Response, next: NextFunction) {

        //Body that is not valid JSON
        if (err?.type === "entity.parse.failed") {
            response.status(StatusCode.BadRequest).json({ message: "בקשה לא תקינה" });
            return;
        }

        //Text longer than the column (instead of a server error)
        if (err?.code === "ER_DATA_TOO_LONG") {
            response.status(StatusCode.BadRequest).json({ message: "אחד השדות ארוך מדי" });
            return;
        }

        if (err?.status === StatusCode.Forbidden) {
            securityLog("access_denied", request, { reason: err.message });
        }
        else if (!err?.status || err.status >= 500) {
            console.error(err);
        }

        //Duplicate unique key from MySQL
        if (err?.code === "ER_DUP_ENTRY") {
            response.status(StatusCode.Conflict).json({ message: "הרשומה כבר קיימת" });
            return;
        }

        const status = err.status || StatusCode.InternalServerError;

        const isServerError = status >= 500 && status <= 599;

        const message = appConfig.isProduction && isServerError ? "אירעה שגיאה, נסו שוב" : err.message;

        response.status(status).json({ message });
    }

}


export const errorMiddleware = new ErrorMiddleware();
