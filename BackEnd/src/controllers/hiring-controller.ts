import express, { NextFunction, Request, Response } from "express";
import { HiringDto } from "../models/hiring-model";
import { hiringService } from "../services/hiring-service";
import { allowRoles } from "../middleware/role-middleware";
import { verifyToken } from "../middleware/verify-token";
import { UserRole } from "../enum/enum";


class HiringController {

    public readonly router = express.Router();


    public constructor() {
        this.router.get("/api/hiring", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.getAllHiring);
        this.router.post("/api/hiring", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.addHiring);
        this.router.put("/api/hiring/:id", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.updateHiring);
        this.router.delete("/api/hiring/:id", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.deleteHiring);
    }


    //Get All Hiring
    private async getAllHiring(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const items = await hiringService.getAllHiring();

            response.json(items);

        } catch (err: any) {
            next(err)
        }
    }


    //Add Hiring
    private async addHiring(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const item: HiringDto = request.body;

            const addedItem = await hiringService.addHiring(item, request.user!);

            response.status(201).json(addedItem);

        } catch (err: any) {
            next(err)
        }
    }


    //Update Hiring
    private async updateHiring(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const item: HiringDto = request.body;

            const updatedItem = await hiringService.updateHiring(id, item);

            response.json(updatedItem);

        } catch (err: any) {
            next(err)
        }
    }


    //Delete Hiring
    private async deleteHiring(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await hiringService.deleteHiring(id);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }

}


export const hiringController = new HiringController();
