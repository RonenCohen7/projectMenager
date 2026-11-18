import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "יותר מדי בקשות. נסו שוב בעוד כמה דקות."
    }
});

export const loginCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "יותר מדי ניסיונות התחברות. נסו שוב בעוד 15 דקות."
    }
});
