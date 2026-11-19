import { Request } from "express";


//Security events - one JSON line each (docker logs pm-backend | grep '"type":"security"').
//Never logs codes, tokens or passwords.
export type SecurityEvent =
    | "login_code_requested"
    | "login_code_unknown_email"
    | "login_code_cooldown"
    | "login_success"
    | "login_failed"
    | "login_locked"
    | "logout"
    | "auth_rejected"
    | "access_denied"
    | "csrf_blocked"
    | "cors_blocked"
    | "rate_limited"
    | "data_change";


export function securityLog(event: SecurityEvent, request: Request | null, details: Record<string, unknown> = {}): void {

    const entry = {
        time: new Date().toISOString(),
        type: "security",
        event,
        ip: request?.ip,
        idUser: request?.user?.idUser,
        method: request?.method,
        path: request?.originalUrl?.split("?")[0],
        ...details
    };

    console.log(JSON.stringify(entry));
}
