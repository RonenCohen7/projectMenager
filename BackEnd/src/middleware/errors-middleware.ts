import { NextFunction, Request, Response } from "express";
import { RouteNotFoundError } from "../models/client-errors";

import { appConfig } from "../utils/app-config";
import { StatusCode } from "../enum/enum";


class ErrorMiddleware {

    public routeNotFound(request: Request, response: Response, next: NextFunction) {
        next(new RouteNotFoundError(request.originalUrl));
    }


    public catchAll(err: any, request: Request, response: Response, next: NextFunction) {
        console.error(err);

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
