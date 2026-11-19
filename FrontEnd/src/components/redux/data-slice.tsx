import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ProjectModel } from "../models/project-model";
import type { TaskModel } from "../models/task-model";
import type { UserModel } from "../models/user-model";
import type { ClientModel } from "../models/client-model";
import type { PlanModel } from "../models/plan-model";
import type { InfoModel } from "../models/info-model";
import type { HiringModel } from "../models/hiring-model";
import type { HeatSettingsModel } from "../models/settings-model";


//All the data of the screens. Every service dispatches here after a load / change,
//and the live connection reloads it when someone else changes something - no browser refresh needed.
//null = not loaded yet (screen was not opened / no permission)
export interface DataState {
    projects: ProjectModel[];
    tasks: TaskModel[];
    users: UserModel[];
    loaded: boolean;

    clients: ClientModel[] | null;
    plan: PlanModel[] | null;
    info: InfoModel[] | null;
    hiring: HiringModel[] | null;
    heat: HeatSettingsModel | null;

    //Grows on every change of projects / tasks - open project panel reloads its details
    version: number;
}

const initialState: DataState = {
    projects: [],
    tasks: [],
    users: [],
    loaded: false,

    clients: null,
    plan: null,
    info: null,
    hiring: null,
    heat: null,

    version: 0
};

export const defaultHeat: HeatSettingsModel = { weekHours: 42, levels: { low: 10, medium: 25, high: 40 } };

const dataSlice = createSlice({
    name: "data",
    initialState,

    reducers: {
        setProjects(state, action: PayloadAction<ProjectModel[]>) {
            state.projects = action.payload;
            state.loaded = true;
            state.version++;
        },
        setTasks(state, action: PayloadAction<TaskModel[]>) {
            state.tasks = action.payload;
            state.version++;
        },
        setUsers(state, action: PayloadAction<UserModel[]>) {
            state.users = action.payload;
        },
        setClients(state, action: PayloadAction<ClientModel[]>) {
            state.clients = action.payload;
        },
        setPlan(state, action: PayloadAction<PlanModel[]>) {
            state.plan = action.payload;
        },
        setInfo(state, action: PayloadAction<InfoModel[]>) {
            state.info = action.payload;
        },
        setHiring(state, action: PayloadAction<HiringModel[]>) {
            state.hiring = action.payload;
        },
        setHeat(state, action: PayloadAction<HeatSettingsModel>) {
            state.heat = action.payload;
        },
        clearData() {
            return initialState;
        }
    }
});

export const { setProjects, setTasks, setUsers, setClients, setPlan, setInfo, setHiring, setHeat, clearData } = dataSlice.actions;
export default dataSlice.reducer;
