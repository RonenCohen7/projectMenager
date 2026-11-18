import axios from "axios";
import type { UserDto, UserModel, UserProjectDto } from "../models/user-model";
import { appConfig } from "../utils/app-config";
import { store } from "../redux/store";
import { setUsers } from "../redux/data-slice";
import { projectService } from "./projectService";



class UserService {

    //Get All Users (team) -> store
    public async getAllUsers(): Promise<UserModel[]> {
        const response = await axios.get<UserModel[]>(appConfig.usersUrl);
        store.dispatch(setUsers(response.data));
        return response.data;
    }

    //Add User
    public async addUser(user: UserDto): Promise<UserModel> {
        const response = await axios.post<UserModel>(appConfig.usersUrl, user);
        await this.getAllUsers();
        return response.data;
    }

    //Update User
    public async updateUser(id: number, user: UserDto): Promise<UserModel> {
        const response = await axios.put<UserModel>(appConfig.usersUrl + id, user);
        await this.getAllUsers();
        return response.data;
    }

    //Projects the user may enter and work in (replaces the list)
    public async updateUserProjects(id: number, projects: UserProjectDto[]): Promise<void> {
        await axios.put(appConfig.usersUrl + id + "/projects", { projects });
        await projectService.getAllProjects();
    }

    //Delete User
    public async deleteUser(id: number): Promise<void> {
        await axios.delete(appConfig.usersUrl + id);
        await this.getAllUsers();
    }

}

export const userService = new UserService();
