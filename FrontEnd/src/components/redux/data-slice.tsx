import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ProjectModel } from "../models/project-model";
import type { TaskModel } from "../models/task-model";
import type { UserModel } from "../models/user-model";


//Shared data of the screens (projects, tasks, team) - refreshed after every change
export interface DataState {
    projects: ProjectModel[];
    tasks: TaskModel[];
    users: UserModel[];
    loaded: boolean;
}

const initialState: DataState = {
    projects: [],
    tasks: [],
    users: [],
    loaded: false
};

const dataSlice = createSlice({
    name: "data",
    initialState,

    reducers: {
        setProjects(state, action: PayloadAction<ProjectModel[]>) {
            state.projects = action.payload;
            state.loaded = true;
        },
        setTasks(state, action: PayloadAction<TaskModel[]>) {
            state.tasks = action.payload;
        },
        setUsers(state, action: PayloadAction<UserModel[]>) {
            state.users = action.payload;
        },
        clearData() {
            return initialState;
        }
    }
});

export const { setProjects, setTasks, setUsers, clearData } = dataSlice.actions;
export default dataSlice.reducer;
