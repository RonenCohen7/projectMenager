import axios from "axios";
import type { ProjectDetailsModel, ProjectDto, ProjectModel, StageDto, StageModel } from "../models/project-model";
import type { UpdateDto, UpdateModel } from "../models/update-model";
import type { InvoiceStatus, LoadLevel } from "../models/enum";
import { appConfig } from "../utils/app-config";
import { store } from "../redux/store";
import { setProjects } from "../redux/data-slice";
import { taskService } from "./taskService";



class ProjectService {

    //Get All Projects (employee gets only his projects) -> store
    public async getAllProjects(): Promise<ProjectModel[]> {
        const response = await axios.get<ProjectModel[]>(appConfig.projectsUrl);
        store.dispatch(setProjects(response.data));
        return response.data;
    }

    //Get One Project (details, stages, log, tasks)
    public async getOneProject(id: number): Promise<ProjectDetailsModel> {
        const response = await axios.get<ProjectDetailsModel>(appConfig.projectsUrl + id);
        return response.data;
    }

    //Lists + tasks after a change
    public async refresh(): Promise<void> {
        await Promise.all([this.getAllProjects(), taskService.getTasks()]);
    }

    //Add Project / Lead
    public async addProject(project: ProjectDto): Promise<ProjectDetailsModel> {
        const response = await axios.post<ProjectDetailsModel>(appConfig.projectsUrl, project);
        await this.refresh();
        return response.data;
    }

    //Update Project
    public async updateProject(id: number, project: ProjectDto): Promise<ProjectDetailsModel> {
        const response = await axios.put<ProjectDetailsModel>(appConfig.projectsUrl + id, project);
        await this.refresh();
        return response.data;
    }

    //Status / phase
    public async updateStatus(id: number, change: { status?: string, phase?: string | null }): Promise<void> {
        await axios.patch(appConfig.projectsUrl + id + "/status", change);
        await this.refresh();
    }

    //Lead -> project
    public async convertLead(id: number): Promise<void> {
        await axios.patch(appConfig.projectsUrl + id + "/convert");
        await this.refresh();
    }

    //Invoice status
    public async updateInvoice(id: number, invoiceStatus: InvoiceStatus): Promise<void> {
        await axios.patch(appConfig.projectsUrl + id + "/invoice", { invoiceStatus });
        await this.getAllProjects();
    }

    //Load level of a member
    public async updateMemberLoad(id: number, idUser: number, loadLevel: LoadLevel | null): Promise<void> {
        await axios.patch(appConfig.projectsUrl + id + "/members/" + idUser + "/load", { loadLevel });
        await this.getAllProjects();
    }

    //Delete Project
    public async deleteProject(id: number): Promise<void> {
        await axios.delete(appConfig.projectsUrl + id);
        await this.refresh();
    }

    //Stages
    public async addStages(id: number, stages: StageDto[]): Promise<StageModel[]> {
        const response = await axios.post<StageModel[]>(appConfig.projectsUrl + id + "/stages", stages);
        await this.getAllProjects();
        return response.data;
    }

    public async updateStage(id: number, stage: StageDto): Promise<StageModel> {
        const response = await axios.put<StageModel>(appConfig.stagesUrl + id, stage);
        await this.getAllProjects();
        return response.data;
    }

    public async deleteStage(id: number): Promise<void> {
        await axios.delete(appConfig.stagesUrl + id);
        await this.getAllProjects();
    }

    //Meetings log
    public async getAllUpdates(): Promise<UpdateModel[]> {
        const response = await axios.get<UpdateModel[]>(appConfig.updatesUrl);
        return response.data;
    }

    public async addUpdate(id: number, update: UpdateDto): Promise<UpdateModel> {
        const response = await axios.post<UpdateModel>(appConfig.projectsUrl + id + "/updates", update);
        await this.refresh();
        return response.data;
    }

    public async editUpdate(id: number, update: UpdateDto): Promise<UpdateModel> {
        const response = await axios.put<UpdateModel>(appConfig.updatesUrl + id, update);
        await this.getAllProjects();
        return response.data;
    }

    public async deleteUpdate(id: number): Promise<void> {
        await axios.delete(appConfig.updatesUrl + id);
        await this.refresh();
    }

}

export const projectService = new ProjectService();
