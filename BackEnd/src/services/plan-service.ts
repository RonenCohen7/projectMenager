import { OkPacketParams } from "mysql2";
import { dal } from "../utils/dal";
import { PlanDto, PlanModel } from "../models/plan-model";
import { ResourceNotFoundError, ValidationError } from "../models/client-errors";
import { cleanOrNull, dateOrNull, enumOrDefault, numberOrNull, sanitizeText } from "../utils/sanitize";
import { PlanStatus } from "../enum/enum";


class PlanService {

    private readonly selectSql = `
        SELECT
            w.id_plan AS idPlan,
            w.title,
            w.area,
            w.quarter,
            w.id_owner AS idOwner,
            u.first_name AS ownerName,
            w.status,
            w.due_date AS dueDate,
            w.kpi,
            w.notes,
            w.created_at AS createdAt,
            w.updated_at AS updatedAt
        FROM work_plan w

        LEFT JOIN users u
            ON u.id_user = w.id_owner
    `;


    //Get All Plan Items
    public async getAllPlan(): Promise<PlanModel[]> {
        return await dal.execute(`${this.selectSql} ORDER BY w.quarter, w.created_at`) as PlanModel[];
    }


    //Add Plan Item
    public async addPlan(plan: PlanDto): Promise<PlanModel> {
        const values = this.cleanPlan(plan);

        const sql = `
            INSERT INTO work_plan (title, area, quarter, id_owner, status, due_date, kpi, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const info = await dal.execute(sql, values) as OkPacketParams;
        return await this.getOnePlan(info.insertId!);
    }


    //Update Plan Item
    public async updatePlan(id: number, plan: PlanDto): Promise<PlanModel> {
        const current = await this.getOnePlan(id);
        const values = this.cleanPlan({ ...current, ...plan });

        const sql = `
            UPDATE work_plan
            SET title = ?, area = ?, quarter = ?, id_owner = ?, status = ?, due_date = ?, kpi = ?, notes = ?
            WHERE id_plan = ?
        `;

        await dal.execute(sql, [...values, id]);
        return await this.getOnePlan(id);
    }


    //Delete Plan Item
    public async deletePlan(id: number): Promise<void> {
        const info = await dal.execute(`DELETE FROM work_plan WHERE id_plan = ?`, [id]) as OkPacketParams;
        if (info.affectedRows === 0) {
            throw new ResourceNotFoundError(id);
        }
    }


    private async getOnePlan(id: number): Promise<PlanModel> {
        const items = await dal.execute(`${this.selectSql} WHERE w.id_plan = ?`, [id]) as PlanModel[];
        if (!items[0]) {
            throw new ResourceNotFoundError(id);
        }
        return items[0];
    }


    private cleanPlan(plan: PlanDto) {
        const title = sanitizeText(plan.title);
        if (!title) throw new ValidationError("יש למלא יעד / משימה");

        const quarter = sanitizeText(plan.quarter);

        return [
            title,
            cleanOrNull(plan.area),
            /^Q[1-4] \d{4}$/.test(quarter) ? quarter : null,
            numberOrNull(plan.idOwner),
            enumOrDefault(plan.status, Object.values(PlanStatus), PlanStatus.NotStarted),
            dateOrNull(plan.dueDate),
            cleanOrNull(plan.kpi),
            cleanOrNull(plan.notes)
        ];
    }

}


export const planService = new PlanService();
