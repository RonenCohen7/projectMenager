import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { appConfig } from "./utils/app-config";
import { errorMiddleware } from "./middleware/errors-middleware";
import { apiLimiter } from "./middleware/rate-limit-middleware";
import { securityMiddleware } from "./middleware/security-middleware";
import { securityLog } from "./utils/security-log";

import { authController } from "./controllers/auth-controller";
import { userController } from "./controllers/users-controller";
import { clientController } from "./controllers/clients-controller";
import { projectController } from "./controllers/projects-controller";
import { taskController } from "./controllers/tasks-controller";
import { planController } from "./controllers/plan-controller";
import { infoController } from "./controllers/info-controller";
import { hiringController } from "./controllers/hiring-controller";
import { settingsController } from "./controllers/settings-controller";
import { liveController } from "./controllers/live-controller";
import { liveService } from "./services/live-service";
import { userService } from "./services/users-service";



class App {

    public async start(): Promise<void> {
        try {

            appConfig.validate();

            const app = express();

            app.set("trust proxy", 1);

            app.use(helmet());

            app.use(cookieParser());

            //Allowed: same host (behind nginx) or FRONTEND_URL (dev)
            app.use(cors((request, callback) => {

                const origin = request.header("Origin");

                let allowed = !origin || origin === appConfig.frontendUrl;

                if (origin && !allowed) {
                    try {
                        allowed = new URL(origin).host === request.header("Host");
                    } catch {
                        allowed = false;
                    }
                }

                if (!allowed) {
                    securityLog("cors_blocked", request, { origin });
                    callback(Object.assign(new Error("Not allowed by CORS"), { status: 403 }), { origin: false });
                    return;
                }

                callback(null, { origin: true, credentials: true });
            }));

            app.use(express.json({ limit: "1mb" }));

            app.use("/api", securityMiddleware.csrfGuard);

            app.use(securityMiddleware.auditChanges);

            app.use("/api", apiLimiter);

            //Every successful change is sent to all open browsers (live refresh)
            app.use(liveService.notifyOnChange);

            app.get("/api/health", (request, response) => { response.json({ ok: true }) });

            app.use(liveController.router);
            app.use(authController.router);
            app.use(userController.router);
            app.use(clientController.router);
            app.use(projectController.router);
            app.use(taskController.router);
            app.use(planController.router);
            app.use(infoController.router);
            app.use(hiringController.router);
            app.use(settingsController.router);

            app.use(errorMiddleware.routeNotFound);
            app.use(errorMiddleware.catchAll);

            await userService.ensureSchema();
            await userService.ensureAdmin();

            app.listen(appConfig.port, () => {
                console.log(`Backend server started on port ${appConfig.port}`);
            });

        } catch (err: any) {
            console.log(err);
            process.exit(1);
        }
    }

}

const app = new App();
app.start();
