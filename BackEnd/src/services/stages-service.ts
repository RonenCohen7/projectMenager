import { OkPacketParams } from "mysql2";
import { dal } from "../utils/dal";
import { StageDto, StageModel } from "../models/project-model";
import { TokenUser } from "../models/user-model";
import { ResourceNotFoundError, ValidationError } from "../models/client-errors";
import { cleanOrNull, dateOrNull, enumOrDefault, numberOrNull, sanitizeText } from "../utils/sanitize";
import { StageStatus } from "../enum/enum";
import { projectService } from "./projects-service";


class StageService {

    private readonly selectSql = `
        SELECT
            s.id_stage AS idStage,
            s.id_project AS idProject,
            s.sort_order AS sortOrder,
            s.stage_group AS stageGroup,
            s.stage_name AS stageName,
            s.id_owner AS idOwner,
            u.first_name AS ownerName,
            s.status,
            s.hours,
            s.due_date AS dueDate
        FROM project_stages s

        LEFT JOIN users u
            ON u.id_user = s.id_owner
    `;


    //Get stages of project
    public async getProjectStages(idProject: number): Promise<StageModel[]> {
        const sql = `${this.selectSql} WHERE s.id_project = ? ORDER BY s.sort_order, s.id_stage`;
        return await dal.execute(sql, [idProject]) as StageModel[];
    }


    //Add stages (one stage or a whole template) at the end of the list
    public async addStages(idProject: number, stages: StageDto[], user: TokenUser): Promise<StageModel[]> {
        await projectService.assertAccess(user, idProject);

        const clean = stages.map(stage => ({ ...stage, stageName: sanitizeText(stage.stageName) })).filter(stage => stage.stageName);
        if (!clean.length) throw new ValidationError("יש למלא שם שלב");

        const rows = await dal.execute(
            `SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM project_stages WHERE id_project = ?`, [idProject]
        ) as { maxOrder: number }[];

        let order = Number(rows[0].maxOrder) + 1;

        for (const stage of clean) {
            const sql = `
                INSERT INTO project_stages (id_project, sort_order, stage_group, stage_name, id_owner, status, hours, due_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await dal.execute(sql, [
                idProject,
                order++,
                cleanOrNull(stage.stageGroup),
                stage.stageName,
                numberOrNull(stage.idOwner),
                enumOrDefault(stage.status, Object.values(StageStatus), StageStatus.Todo),
                numberOrNull(stage.hours),
                dateOrNull(stage.dueDate)
            ]);
        }

        await projectService.touch(idProject);

        return await this.getProjectStages(idProject);
    }


    //Update Stage
    public async updateStage(id: number, stage: StageDto, user: TokenUser): Promise<StageModel> {
        const current = await this.getOneStage(id);
        await projectService.assertAccess(user, current.idProject);

        const merged = { ...current, ...stage };
        const stageName = sanitizeText(merged.stageName);
        if (!stageName) throw new ValidationError("יש למלא שם שלב");

        const sql = `
            UPDATE project_stages
            SET
                sort_order = ?,
                stage_group = ?,
                stage_name = ?,
                id_owner = ?,
                status = ?,
                hours = ?,
                due_date = ?
            WHERE id_stage = ?
        `;

        await dal.execute(sql, [
            numberOrNull(merged.sortOrder) ?? 0,
            cleanOrNull(merged.stageGroup),
            stageName,
            numberOrNull(merged.idOwner),
            enumOrDefault(merged.status, Object.values(StageStatus), StageStatus.Todo),
            numberOrNull(merged.hours),
            dateOrNull(merged.dueDate),
            id
        ]);

        await projectService.touch(current.idProject);

        return await this.getOneStage(id);
    }


    //Delete Stage
    public async deleteStage(id: number, user: TokenUser): Promise<void> {
        const current = await this.getOneStage(id);
        await projectService.assertAccess(user, current.idProject);

        await dal.execute(`DELETE FROM project_stages WHERE id_stage = ?`, [id]) as OkPacketParams;
    }


    private async getOneStage(id: number): Promise<StageModel> {
        const stages = await dal.execute(`${this.selectSql} WHERE s.id_stage = ?`, [id]) as StageModel[];
        if (!stages[0]) {
            throw new ResourceNotFoundError(id);
        }
        return stages[0];
    }

}


export const stageService = new StageService();
