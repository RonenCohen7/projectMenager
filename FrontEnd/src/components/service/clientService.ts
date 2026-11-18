import axios from "axios";
import type { ClientDto, ClientModel } from "../models/client-model";
import { appConfig } from "../utils/app-config";



class ClientService {

    //Get All Clients
    public async getAllClients(): Promise<ClientModel[]> {
        const response = await axios.get<ClientModel[]>(appConfig.clientsUrl);
        return response.data;
    }

    //Add Client
    public async addClient(client: ClientDto): Promise<ClientModel> {
        const response = await axios.post<ClientModel>(appConfig.clientsUrl, client);
        return response.data;
    }

    //Update Client
    public async updateClient(id: number, client: ClientDto): Promise<ClientModel> {
        const response = await axios.put<ClientModel>(appConfig.clientsUrl + id, client);
        return response.data;
    }

    //Delete Client
    public async deleteClient(id: number): Promise<void> {
        await axios.delete(appConfig.clientsUrl + id);
    }

}

export const clientService = new ClientService();
