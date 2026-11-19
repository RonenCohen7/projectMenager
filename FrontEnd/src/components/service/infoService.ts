import axios from "axios";
import type { InfoModel, InfoDto } from "../models/info-model";
import { appConfig } from "../utils/app-config";
import { store } from "../redux/store";
import { setInfo } from "../redux/data-slice";


//Every change reloads the list into the store - all screens update at once
class InfoService {

    //Get All -> store
    public async getAll(): Promise<InfoModel[]> {
        const response = await axios.get<InfoModel[]>(appConfig.infoUrl);
        store.dispatch(setInfo(response.data));
        return response.data;
    }

    //Add
    public async add(item: InfoDto): Promise<InfoModel> {
        const response = await axios.post<InfoModel>(appConfig.infoUrl, item);
        await this.afterChange();
        return response.data;
    }

    //Update
    public async update(id: number, item: InfoDto): Promise<InfoModel> {
        const response = await axios.put<InfoModel>(appConfig.infoUrl + id, item);
        await this.afterChange();
        return response.data;
    }

    //Delete
    public async delete(id: number): Promise<void> {
        await axios.delete(appConfig.infoUrl + id);
        await this.afterChange();
    }

    //Reload after a change
    public async afterChange(): Promise<void> {
        await this.getAll();
    }

}

export const infoService = new InfoService();
