import express, { NextFunction, Request, Response } from "express";
import { TaskDto } from "../models/task-model";
import { taskService } from "../services/tasks-service";
import { verifyToken } from "../middleware/verify-token";


class TaskController {

    public readonly router = express.Router();


    public constructor() {
        this.router.get("/api/tasks", verifyToken, this.getTasks);
        this.router.post("/api/tasks", verifyToken, this.addTask);
        this.router.put("/api/tasks/:id", verifyToken, this.updateTask);
        this.router.patch("/api/tasks/:id/done", verifyToken, this.setDone);
        this.router.delete("/api/tasks/:id", verifyToken, this.deleteTask);
    }


    //Get Tasks (open + closed in the last 14 days)
    private async getTasks(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tasks = await taskService.getTasks(request.user!);

            response.json(tasks);

        } catch (err: any) {
            next(err)
        }
    }


    //Add Task
    private async addTask(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const task: TaskDto = request.body;

            const addedTask = await taskService.addTask(task, request.user!);

            response.status(201).json(addedTask);

        } catch (err: any) {
            next(err)
        }
    }


    //Update Task
    private async updateTask(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const task: Partial<TaskDto> = request.body;

            const updatedTask = await taskService.updateTask(id, task, request.user!);

            response.json(updatedTask);

        } catch (err: any) {
            next(err)
        }
    }


    //Done / Undo
    private async setDone(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const task = await taskService.setDone(id, Boolean(request.body?.isDone), request.user!);

            response.json(task);

        } catch (err: any) {
            next(err)
        }
    }


    //Delete Task
    private async deleteTask(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await taskService.deleteTask(id, request.user!);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }

}


export const taskController = new TaskController();
