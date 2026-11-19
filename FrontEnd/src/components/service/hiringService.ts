import axios from "axios";
import type { HiringModel, HiringDto } from "../models/hiring-model";
import { appConfig } from "../utils/app-config";
import { store } from "../redux/store";
import { setHiring } from "../redux/data-slice";


//Every change reloads the list into the store - all screens update at once
class HiringService {

    //Get All -> store
    public async getAll(): Promise<HiringModel[]> {
        const response = await axios.get<HiringModel[]>(appConfig.hiringUrl);
        store.dispatch(setHiring(response.data));
        return response.data;
    }

    //Add
    public async add(item: HiringDto): Promise<HiringModel> {
        const response = await axios.post<HiringModel>(appConfig.hiringUrl, item);
        await this.afterChange();
        return response.data;
    }

    //Update
    public async update(id: number, item: HiringDto): Promise<HiringModel> {
        const response = await axios.put<HiringModel>(appConfig.hiringUrl + id, item);
        await this.afterChange();
        return response.data;
    }

    //Delete
    public async delete(id: number): Promise<void> {
        await axios.delete(appConfig.hiringUrl + id);
        await this.afterChange();
    }

    //Reload after a change
    public async afterChange(): Promise<void> {
        await this.getAll();
    }

}

export const hiringService = new HiringService();
