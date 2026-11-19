import { Request, Response, NextFunction } from "express";
import { UserRole } from "../enum/enum";
import { securityLog } from "../utils/security-log";


export function allowRoles(...roles: UserRole[]) {

    return (request: Request, response: Response, next: NextFunction): void => {
        const user = request.user;
        if (!user) {
            response.sendStatus(401);
            return;
        }
        if (!roles.includes(user.role)) {
            securityLog("access_denied", request, { role: user.role, required: roles });
            response.status(403).json({ message: "אין לך הרשאה לפעולה הזו" });
            return;
        }
        next();
    }
}


//Admin and manager see every project, employee only projects he is assigned to
export function isPrivileged(role: UserRole): boolean {
    return role === UserRole.Admin || role === UserRole.Manager;
}
