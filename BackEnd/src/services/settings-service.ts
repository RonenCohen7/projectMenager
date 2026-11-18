import { dal } from "../utils/dal";
import { HeatSettingsModel } from "../models/settings-model";
import { numberOrNull } from "../utils/sanitize";


const HEAT_DEFAULT: HeatSettingsModel = { weekHours: 42, levels: { low: 10, medium: 25, high: 40 } };


class SettingsService {

    //Load map settings
    public async getHeat(): Promise<HeatSettingsModel> {
        const rows = await dal.execute(
            `SELECT setting_value AS settingValue FROM settings WHERE setting_key = 'heat'`
        ) as { settingValue: HeatSettingsModel | string }[];

        //MySQL returns JSON parsed, MariaDB as text
        const value = rows[0]?.settingValue;
        const saved: HeatSettingsModel | undefined = typeof value === "string" ? JSON.parse(value) : value;
        return {
            weekHours: saved?.weekHours || HEAT_DEFAULT.weekHours,
            levels: { ...HEAT_DEFAULT.levels, ...(saved?.levels || {}) }
        };
    }


    //Save load map settings
    public async updateHeat(heat: HeatSettingsModel): Promise<HeatSettingsModel> {
        const pct = (value: unknown, fallback: number) => Math.min(100, Math.max(0, numberOrNull(value) ?? fallback));

        const clean: HeatSettingsModel = {
            weekHours: Math.min(60, Math.max(10, numberOrNull(heat.weekHours) ?? HEAT_DEFAULT.weekHours)),
            levels: {
                low: pct(heat.levels?.low, HEAT_DEFAULT.levels.low),
                medium: pct(heat.levels?.medium, HEAT_DEFAULT.levels.medium),
                high: pct(heat.levels?.high, HEAT_DEFAULT.levels.high)
            }
        };

        const sql = `
            INSERT INTO settings (setting_key, setting_value)
            VALUES ('heat', ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `;

        await dal.execute(sql, [JSON.stringify(clean)]);
        return clean;
    }

}


export const settingsService = new SettingsService();
