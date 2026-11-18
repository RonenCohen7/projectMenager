import axios from "axios";
import type { InfoModel, InfoDto } from "../models/info-model";
import { appConfig } from "../utils/app-config";



class InfoService {

    //Get All
    public async getAll(): Promise<InfoModel[]> {
        const response = await axios.get<InfoModel[]>(appConfig.infoUrl);
        return response.data;
    }

    //Add
    public async add(item: InfoDto): Promise<InfoModel> {
        const response = await axios.post<InfoModel>(appConfig.infoUrl, item);
        return response.data;
    }

    //Update
    public async update(id: number, item: InfoDto): Promise<InfoModel> {
        const response = await axios.put<InfoModel>(appConfig.infoUrl + id, item);
        return response.data;
    }

    //Delete
    public async delete(id: number): Promise<void> {
        await axios.delete(appConfig.infoUrl + id);
    }

}

export const infoService = new InfoService();
