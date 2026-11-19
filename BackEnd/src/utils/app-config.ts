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


    //Fail fast on missing / weak secrets - the server does not start with a placeholder secret
    public validate(): void {
        const errors: string[] = [];

        if (!this.jwtSecret || this.jwtSecret.length < 32) {
            errors.push("JWT_SECRET must be at least 32 characters (openssl rand -hex 32)");
        }
        else if (/change_me|secret|example/i.test(this.jwtSecret)) {
            errors.push("JWT_SECRET is still the example value - generate a new one (openssl rand -hex 32)");
        }

        for (const [name, value] of [["MYSQL_HOST", this.mysqlHost], ["MYSQL_USER", this.mysqlUser], ["MYSQL_PASSWORD", this.mysqlPassword], ["MYSQL_DATABASE", this.mysqlDatabase]]) {
            if (!value) errors.push(`${name} is missing`);
        }

        if (this.isProduction && /change_me/i.test(this.mysqlPassword ?? "")) {
            errors.push("MYSQL_PASSWORD is still the example value");
        }

        if (errors.length) {
            throw new Error("Configuration error:\n - " + errors.join("\n - "));
        }

        if (this.isProduction && !(this.smtpHost && this.smtpUser && this.smtpPass && this.mailFrom)) {
            console.warn("WARNING: SMTP is not configured - users will not receive login codes");
        }
    }

}

export const appConfig = new AppConfig();
