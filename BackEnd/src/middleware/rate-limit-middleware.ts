import rateLimit from "express-rate-limit";
import { securityLog } from "../utils/security-log";

const onLimit = (limiter: string) => (request: any, response: any, next: any, options: any) => {
    securityLog("rate_limited", request, { limiter });
    response.status(options.statusCode).json(options.message);
};

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "יותר מדי בקשות. נסו שוב בעוד כמה דקות."
    },
    handler: onLimit("api")
});

export const loginCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "יותר מדי ניסיונות התחברות. נסו שוב בעוד 15 דקות."
    },
    handler: onLimit("login")
});
