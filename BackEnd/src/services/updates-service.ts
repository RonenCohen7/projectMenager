import { OkPacketParams } from "mysql2";
import { dal } from "../utils/dal";
import { UpdateDto, UpdateModel } from "../models/update-model";
import { TokenUser } from "../models/user-model";
import { ForbiddenError, ResourceNotFoundError, ValidationError } from "../models/client-errors";
import { cleanOrNull, dateOrNull, enumOrDefault, numberOrNull, sanitizeText } from "../utils/sanitize";
import { Priority, UpdateType } from "../enum/enum";
import { isPrivileged } from "../middleware/role-middleware";
import { projectService } from "./projects-service";


class UpdateService {

    private readonly selectSql = `
        SELECT
            u.id_update AS idUpdate,
            u.id_project AS idProject,
            u.update_date AS updateDate,
            u.update_type AS updateType,
            u.participants,
            u.summary,
            u.tasks_text AS tasksText,
            u.status_after AS statusAfter,
            u.id_author AS idAuthor,
            TRIM(CONCAT(a.first_name, ' ', a.last_name)) AS authorName,
            u.created_at AS createdAt,
            u.edited_at AS editedAt
        FROM project_updates u

        LEFT JOIN users a
            ON a.id_user = u.id_author
    `;


    //Meeting log of a project - newest first
    public async getProjectUpdates(idProject: number): Promise<UpdateModel[]> {
        const sql = `${this.selectSql} WHERE u.id_project = ? ORDER BY u.update_date DESC, u.created_at DESC`;
        return await dal.execute(sql, [idProject]) as UpdateModel[];
    }


    //Meetings log of all visible projects (export)
    public async getAllUpdates(user: TokenUser): Promise<UpdateModel[]> {
        const access = isPrivileged(user.role)
            ? { sql: "1 = 1", values: [] as number[] }
            : { sql: "EXISTS (SELECT 1 FROM project_members m WHERE m.id_project = u.id_project AND m.id_user = ?)", values: [user.idUser] };

        const sql = `${this.selectSql} WHERE ${access.sql} ORDER BY u.update_date DESC, u.created_at DESC`;
        return await dal.execute(sql, access.values) as UpdateModel[];
    }


    //Add meeting / update. "Next step" creates a task, "status after" updates the project
    public async addUpdate(idProject: number, update: UpdateDto, user: TokenUser): Promise<UpdateModel> {
        await projectService.assertAccess(user, idProject);

        const clean = this.cleanUpdate(update);
        const nextStep = sanitizeText(update.nextStep);

        if (!clean.summary && !clean.tasksText && !nextStep) {
            throw new ValidationError("כדאי לכתוב לפחות מה עלה בפגישה");
        }

        const kind = await projectService.getKind(idProject);
        const statusAfter = clean.statusAfter ? projectService.cleanStatus(kind, clean.statusAfter) : null;

        const idUpdate = await dal.transaction(async connection => {

            const sql = `
                INSERT INTO project_updates (id_project, update_date, update_type, participants, summary, tasks_text, status_after, id_author)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [info] = await connection.query(sql, [
                idProject, clean.updateDate, clean.updateType, clean.participants, clean.summary, clean.tasksText, statusAfter, user.idUser
            ]) as [OkPacketParams, any];

            if (nextStep) {
                const taskSql = `
                    INSERT INTO tasks (id_project, id_update, task_text, id_owner, id_with_user, with_client, priority, due_date, id_created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                await connection.query(taskSql, [
                    idProject,
                    info.insertId,
                    nextStep,
                    user.idUser,
                    numberOrNull(update.idWithUser),
                    Boolean(update.withClient),
                    enumOrDefault(update.taskPriority, Object.values(Priority), Priority.Normal),
                    dateOrNull(update.taskDue),
                    user.idUser
                ]);
            }

            if (statusAfter) {
                await connection.query(`UPDATE projects SET status = ? WHERE id_project = ?`, [statusAfter, idProject]);
            } else {
                await connection.query(`UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id_project = ?`, [idProject]);
            }

            return info.insertId!;
        });

        return await this.getOneUpdate(idUpdate);
    }


    //Edit update - author, admin or manager
    public async updateUpdate(id: number, update: UpdateDto, user: TokenUser): Promise<UpdateModel> {
        const current = await this.getOneUpdate(id);
        await projectService.assertAccess(user, current.idProject);

        if (!isPrivileged(user.role) && current.idAuthor !== user.idUser) {
            throw new ForbiddenError("אפשר לערוך רק תיעוד שכתבת");
        }

        const clean = this.cleanUpdate({ ...current, ...update });
        const kind = await projectService.getKind(current.idProject);

        const sql = `
            UPDATE project_updates
            SET
                update_date = ?,
                update_type = ?,
                participants = ?,
                summary = ?,
                tasks_text = ?,
                status_after = ?,
                edited_at = CURRENT_TIMESTAMP
            WHERE id_update = ?
        `;

        await dal.execute(sql, [
            clean.updateDate, clean.updateType, clean.participants, clean.summary, clean.tasksText,
            clean.statusAfter ? projectService.cleanStatus(kind, clean.statusAfter) : null,
            id
        ]);

        return await this.getOneUpdate(id);
    }


    //Delete update (admin + manager)
    public async deleteUpdate(id: number): Promise<void> {
        const info = await dal.execute(`DELETE FROM project_updates WHERE id_update = ?`, [id]) as OkPacketParams;
        if (info.affectedRows === 0) {
            throw new ResourceNotFoundError(id);
        }
    }


    //System log line (invoice, task completed)
    public async logUpdate(idProject: number, updateType: UpdateType, summary: string, idAuthor: number): Promise<void> {
        const sql = `
            INSERT INTO project_updates (id_project, update_date, update_type, summary, id_author)
            VALUES (?, CURDATE(), ?, ?, ?)
        `;
        await dal.execute(sql, [idProject, updateType, summary, idAuthor]);
        await projectService.touch(idProject);
    }


    private async getOneUpdate(id: number): Promise<UpdateModel> {
        const updates = await dal.execute(`${this.selectSql} WHERE u.id_update = ?`, [id]) as UpdateModel[];
        if (!updates[0]) {
            throw new ResourceNotFoundError(id);
        }
        return updates[0];
    }


    private cleanUpdate(update: UpdateDto) {
        return {
            updateDate: dateOrNull(update.updateDate) ?? new Date().toISOString().slice(0, 10),
            updateType: enumOrDefault(update.updateType, Object.values(UpdateType), UpdateType.ClientMeeting),
            participants: cleanOrNull(update.participants),
            summary: cleanOrNull(update.summary),
            tasksText: cleanOrNull(update.tasksText),
            statusAfter: cleanOrNull(update.statusAfter)
        };
    }

}


export const updateService = new UpdateService();
