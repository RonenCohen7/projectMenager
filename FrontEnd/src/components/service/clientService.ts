import axios from "axios";
import type { ClientModel, ClientDto } from "../models/client-model";
import { appConfig } from "../utils/app-config";
import { store } from "../redux/store";
import { setClients } from "../redux/data-slice";
import { projectService } from "./projectService";


//Every change reloads the list into the store - all screens update at once
class ClientService {

    //Get All -> store
    public async getAllClients(): Promise<ClientModel[]> {
        const response = await axios.get<ClientModel[]>(appConfig.clientsUrl);
        store.dispatch(setClients(response.data));
        return response.data;
    }

    //Add
    public async addClient(item: ClientDto): Promise<ClientModel> {
        const response = await axios.post<ClientModel>(appConfig.clientsUrl, item);
        await this.afterChange();
        return response.data;
    }

    //Update
    public async updateClient(id: number, item: ClientDto): Promise<ClientModel> {
        const response = await axios.put<ClientModel>(appConfig.clientsUrl + id, item);
        await this.afterChange();
        return response.data;
    }

    //Delete
    public async deleteClient(id: number): Promise<void> {
        await axios.delete(appConfig.clientsUrl + id);
        await this.afterChange();
    }

    //Reload after a change
    public async afterChange(): Promise<void> {
        //Client name / counts appear on the projects too
        await Promise.all([this.getAllClients(), projectService.getAllProjects()]);
    }

}

export const clientService = new ClientService();
