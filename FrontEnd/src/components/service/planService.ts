import axios from "axios";
import type { PlanModel, PlanDto } from "../models/plan-model";
import { appConfig } from "../utils/app-config";



class PlanService {

    //Get All
    public async getAll(): Promise<PlanModel[]> {
        const response = await axios.get<PlanModel[]>(appConfig.planUrl);
        return response.data;
    }

    //Add
    public async add(item: PlanDto): Promise<PlanModel> {
        const response = await axios.post<PlanModel>(appConfig.planUrl, item);
        return response.data;
    }

    //Update
    public async update(id: number, item: PlanDto): Promise<PlanModel> {
        const response = await axios.put<PlanModel>(appConfig.planUrl + id, item);
        return response.data;
    }

    //Delete
    public async delete(id: number): Promise<void> {
        await axios.delete(appConfig.planUrl + id);
    }

}

export const planService = new PlanService();
