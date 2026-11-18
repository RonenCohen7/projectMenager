import express, { NextFunction, Request, Response } from "express";
import { PlanDto } from "../models/plan-model";
import { planService } from "../services/plan-service";
import { allowRoles } from "../middleware/role-middleware";
import { verifyToken } from "../middleware/verify-token";
import { UserRole } from "../enum/enum";


class PlanController {

    public readonly router = express.Router();


    public constructor() {
        this.router.get("/api/plan", verifyToken, this.getAllPlan);
        this.router.post("/api/plan", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.addPlan);
        this.router.put("/api/plan/:id", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.updatePlan);
        this.router.delete("/api/plan/:id", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.deletePlan);
    }


    //Get All Plan
    private async getAllPlan(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const items = await planService.getAllPlan();

            response.json(items);

        } catch (err: any) {
            next(err)
        }
    }


    //Add Plan
    private async addPlan(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const item: PlanDto = request.body;

            const addedItem = await planService.addPlan(item);

            response.status(201).json(addedItem);

        } catch (err: any) {
            next(err)
        }
    }


    //Update Plan
    private async updatePlan(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const item: PlanDto = request.body;

            const updatedItem = await planService.updatePlan(id, item);

            response.json(updatedItem);

        } catch (err: any) {
            next(err)
        }
    }


    //Delete Plan
    private async deletePlan(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await planService.deletePlan(id);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }

}


export const planController = new PlanController();
