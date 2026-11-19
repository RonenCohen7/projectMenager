import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/verify-token";
import { liveService } from "../services/live-service";


//Live updates: browsers listen here and refresh their data after any change
class LiveController {

    public readonly router = express.Router();

    public constructor() {
        this.router.get("/api/live", verifyToken, this.subscribe);
    }

    private subscribe(request: Request, response: Response): void {
        liveService.subscribe(request, response);
    }

}

export const liveController = new LiveController();
