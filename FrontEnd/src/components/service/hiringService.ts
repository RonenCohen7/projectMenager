import axios from "axios";
import type { HiringModel, HiringDto } from "../models/hiring-model";
import { appConfig } from "../utils/app-config";



class HiringService {

    //Get All
    public async getAll(): Promise<HiringModel[]> {
        const response = await axios.get<HiringModel[]>(appConfig.hiringUrl);
        return response.data;
    }

    //Add
    public async add(item: HiringDto): Promise<HiringModel> {
        const response = await axios.post<HiringModel>(appConfig.hiringUrl, item);
        return response.data;
    }

    //Update
    public async update(id: number, item: HiringDto): Promise<HiringModel> {
        const response = await axios.put<HiringModel>(appConfig.hiringUrl + id, item);
        return response.data;
    }

    //Delete
    public async delete(id: number): Promise<void> {
        await axios.delete(appConfig.hiringUrl + id);
    }

}

export const hiringService = new HiringService();
