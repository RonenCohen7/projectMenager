import dotenv from "dotenv"

dotenv.config({ quiet: true })

class AppConfig {
    public readonly isDevelopment = process.env.ENVIRONMENT === "development";
    public readonly isProduction = process.env.ENVIRONMENT === "production";


    public readonly port = Number(process.env.PORT || 4000);
    public readonly mysqlHost = process.env.MYSQL_HOST;
    public readonly mysqlPort = Number(process.env.MYSQL_PORT || 3306);
    public readonly mysqlUser = process.env.MYSQL_USER;
    public readonly mysqlPassword = process.env.MYSQL_PASSWORD;
    public readonly mysqlDatabase = process.env.MYSQL_DATABASE;


    public readonly frontendUrl = process.env.FRONTEND_URL!;


    //JWT - valid 12 hours after login
    public readonly jwtSecret = process.env.JWT_SECRET!;

    public readonly jwtExpiresHours = 12;


    //First admin - created on start if missing
    public readonly adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    public readonly adminFirstName = process.env.ADMIN_FIRST_NAME || "Admin";


    //Email (SMTP) - login codes
    public readonly smtpHost = process.env.SMTP_HOST;

    public readonly smtpPort = Number(process.env.SMTP_PORT || 465);

    public readonly smtpSecure = process.env.SMTP_SECURE !== "false";

    public readonly smtpUser = process.env.SMTP_USER;

    public readonly smtpPass = process.env.SMTP_PASS;

    public readonly mailFrom = process.env.MAIL_FROM;

}

export const appConfig = new AppConfig();
