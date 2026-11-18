import axios from "axios";
import type { TaskDto, TaskModel } from "../models/task-model";
import { appConfig } from "../utils/app-config";
import { store } from "../redux/store";
import { setTasks } from "../redux/data-slice";



class TaskService {

    //Open tasks + closed in the last 14 days -> store
    public async getTasks(): Promise<TaskModel[]> {
        const response = await axios.get<TaskModel[]>(appConfig.tasksUrl);
        store.dispatch(setTasks(response.data));
        return response.data;
    }

    //Add Task
    public async addTask(task: TaskDto): Promise<TaskModel> {
        const response = await axios.post<TaskModel>(appConfig.tasksUrl, task);
        await this.getTasks();
        return response.data;
    }

    //Update Task
    public async updateTask(id: number, task: Partial<TaskDto>): Promise<TaskModel> {
        const response = await axios.put<TaskModel>(appConfig.tasksUrl + id, task);
        await this.getTasks();
        return response.data;
    }

    //Done / Undo
    public async setDone(id: number, isDone: boolean): Promise<TaskModel> {
        const response = await axios.patch<TaskModel>(appConfig.tasksUrl + id + "/done", { isDone });
        await this.getTasks();
        return response.data;
    }

    //Delete Task
    public async deleteTask(id: number): Promise<void> {
        await axios.delete(appConfig.tasksUrl + id);
        await this.getTasks();
    }

}

export const taskService = new TaskService();
