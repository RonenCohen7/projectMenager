import axios from "axios";
import type { PlanModel, PlanDto } from "../models/plan-model";
import { appConfig } from "../utils/app-config";
import { store } from "../redux/store";
import { setPlan } from "../redux/data-slice";


//Every change reloads the list into the store - all screens update at once
class PlanService {

    //Get All -> store
    public async getAll(): Promise<PlanModel[]> {
        const response = await axios.get<PlanModel[]>(appConfig.planUrl);
        store.dispatch(setPlan(response.data));
        return response.data;
    }

    //Add
    public async add(item: PlanDto): Promise<PlanModel> {
        const response = await axios.post<PlanModel>(appConfig.planUrl, item);
        await this.afterChange();
        return response.data;
    }

    //Update
    public async update(id: number, item: PlanDto): Promise<PlanModel> {
        const response = await axios.put<PlanModel>(appConfig.planUrl + id, item);
        await this.afterChange();
        return response.data;
    }

    //Delete
    public async delete(id: number): Promise<void> {
        await axios.delete(appConfig.planUrl + id);
        await this.afterChange();
    }

    //Reload after a change
    public async afterChange(): Promise<void> {
        await this.getAll();
    }

}

export const planService = new PlanService();
