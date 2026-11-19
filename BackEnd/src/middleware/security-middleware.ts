import { NextFunction, Request, Response } from "express";
import { securityLog } from "../utils/security-log";


export const CSRF_HEADER = "x-requested-with";


class SecurityMiddleware {

    //CSRF: every change (POST/PUT/PATCH/DELETE) must carry a custom header.
    //A browser on another site cannot add it without a CORS preflight - and CORS blocks other sites.
    public csrfGuard(request: Request, response: Response, next: NextFunction): void {

        if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
            next();
            return;
        }

        if (request.header(CSRF_HEADER) !== "XMLHttpRequest") {
            securityLog("csrf_blocked", request, { origin: request.header("origin") });
            response.status(403).json({ message: "בקשה לא מורשית" });
            return;
        }

        next();
    }


    //Audit trail - every successful change: who, what, when
    public auditChanges(request: Request, response: Response, next: NextFunction): void {

        if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS" && !request.path.startsWith("/api/auth/")) {
            response.on("finish", () => {
                if (response.statusCode < 400) {
                    securityLog("data_change", request, { status: response.statusCode });
                }
            });
        }

        next();
    }

}

export const securityMiddleware = new SecurityMiddleware();
