import "./auth-guard.css";
import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import type { UserRole } from "../../models/enum";


interface AuthGuardProps {
    children: ReactNode;
    roles?: UserRole[];      //Empty = every logged-in user (default employee)
}

export function AuthGuard({ children, roles }: AuthGuardProps) {

    const token = useSelector((state: RootState) => state.auth.token);
    const user = useSelector((state: RootState) => state.auth.user);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return (
            <div className="auth-denied">
                <strong>אין לך הרשאה למסך הזה</strong>
                <span>המסך פתוח למנהלים בלבד. אם צריך גישה, פנו לאדמין של המערכת.</span>
            </div>
        );
    }

    return <>{children}</>;
}
