import express, { NextFunction, Request, Response } from "express";
import { HeatSettingsModel } from "../models/settings-model";
import { settingsService } from "../services/settings-service";
import { allowRoles } from "../middleware/role-middleware";
import { verifyToken } from "../middleware/verify-token";
import { UserRole } from "../enum/enum";


class SettingsController {

    public readonly router = express.Router();


    public constructor() {
        this.router.get("/api/settings/heat", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.getHeat);
        this.router.put("/api/settings/heat", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.updateHeat);
    }


    //Load map settings
    private async getHeat(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const heat = await settingsService.getHeat();

            response.json(heat);

        } catch (err: any) {
            next(err)
        }
    }


    //Save load map settings
    private async updateHeat(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const heat: HeatSettingsModel = request.body;

            const savedHeat = await settingsService.updateHeat(heat);

            response.json(savedHeat);

        } catch (err: any) {
            next(err)
        }
    }

}


export const settingsController = new SettingsController();
