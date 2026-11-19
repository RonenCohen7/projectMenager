import axios from "axios";
import type { HeatSettingsModel } from "../models/settings-model";
import { appConfig } from "../utils/app-config";
import { store } from "../redux/store";
import { setHeat } from "../redux/data-slice";



class SettingsService {

    //Load map settings -> store
    public async getHeat(): Promise<HeatSettingsModel> {
        const response = await axios.get<HeatSettingsModel>(appConfig.heatUrl);
        store.dispatch(setHeat(response.data));
        return response.data;
    }

    //Save load map settings
    public async updateHeat(heat: HeatSettingsModel): Promise<HeatSettingsModel> {
        const response = await axios.put<HeatSettingsModel>(appConfig.heatUrl, heat);
        store.dispatch(setHeat(response.data));
        return response.data;
    }

}

export const settingsService = new SettingsService();
