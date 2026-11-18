import express, { NextFunction, Request, Response } from "express";
import { UserDto, UserProjectDto } from "../models/user-model";
import { userService } from "../services/users-service";
import { allowRoles } from "../middleware/role-middleware";
import { verifyToken } from "../middleware/verify-token";
import { UserRole } from "../enum/enum";


class UserController {

    public readonly router = express.Router();


    public constructor() {
        //Everyone needs the team list (owners, "with whom")
        this.router.get("/api/users", verifyToken, this.getAllUsers);

        this.router.post("/api/users", verifyToken, allowRoles(UserRole.Admin), this.addUser);
        this.router.put("/api/users/:id", verifyToken, allowRoles(UserRole.Admin), this.updateUser);
        this.router.delete("/api/users/:id", verifyToken, allowRoles(UserRole.Admin), this.deleteUser);

        //Projects the user may enter and work in
        this.router.put("/api/users/:id/projects", verifyToken, allowRoles(UserRole.Admin), this.updateUserProjects);
    }


    //Get All Users
    private async getAllUsers(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const users = await userService.getAllUsers();

            response.json(users);

        } catch (err: any) {
            next(err)
        }
    }


    //Add User
    private async addUser(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const user: UserDto = request.body;

            const addedUser = await userService.addUser(user);

            response.status(201).json(addedUser);

        } catch (err: any) {
            next(err)
        }
    }


    //Update User
    private async updateUser(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const user: UserDto = request.body;

            const updatedUser = await userService.updateUser(id, user, request.user!.idUser);

            response.json(updatedUser);

        } catch (err: any) {
            next(err)
        }
    }


    //Update the projects of a user
    private async updateUserProjects(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const projects: UserProjectDto[] = request.body?.projects ?? [];

            await userService.updateUserProjects(id, projects);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }


    //Delete User
    private async deleteUser(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await userService.deleteUser(id, request.user!.idUser);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }

}


export const userController = new UserController();
