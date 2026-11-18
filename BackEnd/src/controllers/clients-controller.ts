import express, { NextFunction, Request, Response } from "express";
import { ClientDto } from "../models/client-model";
import { clientService } from "../services/clients-service";
import { allowRoles } from "../middleware/role-middleware";
import { verifyToken } from "../middleware/verify-token";
import { UserRole } from "../enum/enum";


class ClientController {

    public readonly router = express.Router();


    public constructor() {
        this.router.get("/api/clients", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.getAllClients);
        this.router.get("/api/clients/:id", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.getOneClient);
        this.router.post("/api/clients", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.addClient);
        this.router.put("/api/clients/:id", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.updateClient);
        this.router.delete("/api/clients/:id", verifyToken, allowRoles(UserRole.Admin), this.deleteClient);
    }


    //Get All Clients
    private async getAllClients(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const clients = await clientService.getAllClients();

            response.json(clients);

        } catch (err: any) {
            next(err)
        }
    }


    //Get One Client
    private async getOneClient(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const client = await clientService.getOneClient(id);

            response.json(client);

        } catch (err: any) {
            next(err)
        }
    }


    //Add Client
    private async addClient(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const client: ClientDto = request.body;

            const addedClient = await clientService.addClient(client);

            response.status(201).json(addedClient);

        } catch (err: any) {
            next(err)
        }
    }


    //Update Client
    private async updateClient(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const client: ClientDto = request.body;

            const updatedClient = await clientService.updateClient(id, client);

            response.json(updatedClient);

        } catch (err: any) {
            next(err)
        }
    }


    //Delete Client
    private async deleteClient(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await clientService.deleteClient(id);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }

}


export const clientController = new ClientController();
