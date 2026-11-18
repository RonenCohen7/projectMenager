import express, { NextFunction, Request, Response } from "express";
import { ProjectDto, StageDto } from "../models/project-model";
import { UpdateDto } from "../models/update-model";
import { projectService } from "../services/projects-service";
import { stageService } from "../services/stages-service";
import { updateService } from "../services/updates-service";
import { allowRoles } from "../middleware/role-middleware";
import { verifyToken } from "../middleware/verify-token";
import { UserRole } from "../enum/enum";


class ProjectController {

    public readonly router = express.Router();


    public constructor() {
        //Projects - employee gets only projects he is assigned to
        this.router.get("/api/projects", verifyToken, this.getAllProjects);
        this.router.get("/api/projects/:id", verifyToken, this.getOneProject);

        //Open project / lead and assign employees - admin + manager
        this.router.post("/api/projects", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.addProject);
        this.router.put("/api/projects/:id", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.updateProject);
        this.router.patch("/api/projects/:id/convert", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.convertLead);
        this.router.patch("/api/projects/:id/invoice", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.updateInvoice);
        this.router.patch("/api/projects/:id/members/:idUser/load", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.updateMemberLoad);
        this.router.delete("/api/projects/:id", verifyToken, allowRoles(UserRole.Admin), this.deleteProject);

        //Members of the project
        this.router.patch("/api/projects/:id/status", verifyToken, this.updateStatus);

        this.router.post("/api/projects/:id/stages", verifyToken, this.addStages);
        this.router.put("/api/stages/:id", verifyToken, this.updateStage);
        this.router.delete("/api/stages/:id", verifyToken, this.deleteStage);

        this.router.get("/api/updates", verifyToken, this.getAllUpdates);
        this.router.post("/api/projects/:id/updates", verifyToken, this.addUpdate);
        this.router.put("/api/updates/:id", verifyToken, this.updateUpdate);
        this.router.delete("/api/updates/:id", verifyToken, allowRoles(UserRole.Admin, UserRole.Manager), this.deleteUpdate);
    }


    //Get All Projects
    private async getAllProjects(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const projects = await projectService.getAllProjects(request.user!);

            response.json(projects);

        } catch (err: any) {
            next(err)
        }
    }


    //Get One Project (details, stages, log, tasks)
    private async getOneProject(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const project = await projectService.getOneProject(request.user!, id);

            response.json(project);

        } catch (err: any) {
            next(err)
        }
    }


    //Add Project / Lead
    private async addProject(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const project: ProjectDto = request.body;

            const addedProject = await projectService.addProject(project, request.user!);

            response.status(201).json(addedProject);

        } catch (err: any) {
            next(err)
        }
    }


    //Update Project
    private async updateProject(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const project: ProjectDto = request.body;

            const updatedProject = await projectService.updateProject(id, project, request.user!);

            response.json(updatedProject);

        } catch (err: any) {
            next(err)
        }
    }


    //Status / phase
    private async updateStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const { status, phase } = request.body ?? {};

            await projectService.updateStatus(id, status, phase, request.user!);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }


    //Lead -> Project
    private async convertLead(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await projectService.convertLead(id, request.user!);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }


    //Invoice status
    private async updateInvoice(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await projectService.updateInvoice(id, request.body?.invoiceStatus, request.user!);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }


    //Load level of a member
    private async updateMemberLoad(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);
            const idUser = Number(request.params.idUser);

            await projectService.updateMemberLoad(id, idUser, request.body?.loadLevel ?? null);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }


    //Delete Project
    private async deleteProject(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await projectService.deleteProject(id);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }


    //Add Stages (one or template)
    private async addStages(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const stages: StageDto[] = Array.isArray(request.body) ? request.body : [request.body];

            const allStages = await stageService.addStages(id, stages, request.user!);

            response.status(201).json(allStages);

        } catch (err: any) {
            next(err)
        }
    }


    //Update Stage
    private async updateStage(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const stage: StageDto = request.body;

            const updatedStage = await stageService.updateStage(id, stage, request.user!);

            response.json(updatedStage);

        } catch (err: any) {
            next(err)
        }
    }


    //Delete Stage
    private async deleteStage(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await stageService.deleteStage(id, request.user!);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }


    //Get All Updates (export)
    private async getAllUpdates(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const updates = await updateService.getAllUpdates(request.user!);

            response.json(updates);

        } catch (err: any) {
            next(err)
        }
    }


    //Add meeting / update
    private async addUpdate(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const update: UpdateDto = request.body;

            const addedUpdate = await updateService.addUpdate(id, update, request.user!);

            response.status(201).json(addedUpdate);

        } catch (err: any) {
            next(err)
        }
    }


    //Edit meeting / update
    private async updateUpdate(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            const update: UpdateDto = request.body;

            const updatedUpdate = await updateService.updateUpdate(id, update, request.user!);

            response.json(updatedUpdate);

        } catch (err: any) {
            next(err)
        }
    }


    //Delete meeting / update
    private async deleteUpdate(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(request.params.id);

            await updateService.deleteUpdate(id);

            response.sendStatus(204);

        } catch (err: any) {
            next(err)
        }
    }

}


export const projectController = new ProjectController();
