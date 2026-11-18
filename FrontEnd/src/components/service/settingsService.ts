import axios from "axios";
import type { HeatSettingsModel } from "../models/settings-model";
import { appConfig } from "../utils/app-config";



class SettingsService {

    //Load map settings
    public async getHeat(): Promise<HeatSettingsModel> {
        const response = await axios.get<HeatSettingsModel>(appConfig.heatUrl);
        return response.data;
    }

    //Save load map settings
    public async updateHeat(heat: HeatSettingsModel): Promise<HeatSettingsModel> {
        const response = await axios.put<HeatSettingsModel>(appConfig.heatUrl, heat);
        return response.data;
    }

}

export const settingsService = new SettingsService();
