import express, { NextFunction, Request, Response } from "express";
import { InfoDto } from "../models/info-model";
import { infoService } from "../services/info-service";
import { allowRoles } from "../middleware/role-middleware";
import { verifyToken } from "../middleware/verify-token";
import { UserRole } from "../enum/enum";


class InfoController {

    public readonly router = express.Router();


    public constructor() {
        this.router.get("/api/info", verifyToken, this.getAllInfo);
        this.router.post("/api/info", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.addInfo);
        this.router.put("/api/info/:id", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.updateInfo);
        this.router.delete("/api/info/:id", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.deleteInfo);
    }


    //Get All Info
    private async getAllInfo(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const items = await infoService.getAllInfo();

            response.json(items);

        } catch (err: any) {
            next(err)
        }
    }


    //Add Info
    private async addInfo(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const item: InfoDto = request.body;

            const addedItem = await infoService.addInfo(item, request.user!);

            response.status(201).json(addedItem);

        } catch (err: any) {
            next(err)
        }
    }


    //Update Info
    private async updateInfo(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const item: InfoDto = request.body;

            const updatedItem = await infoService.updateInfo(id, item, request.user!);

            response.json(updatedItem);

        } catch (err: any) {
            next(err)
        }
    }


    //Delete Info
    private async deleteInfo(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await infoService.deleteInfo(id);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }

}


export const infoController = new InfoController();
