import { OkPacketParams } from "mysql2";
import { dal } from "../utils/dal";
import { TaskDto, TaskModel } from "../models/task-model";
import { TokenUser } from "../models/user-model";
import { ForbiddenError, ResourceNotFoundError, ValidationError } from "../models/client-errors";
import { dateOrNull, enumOrDefault, numberOrNull, sanitizeText } from "../utils/sanitize";
import { Priority, UpdateType } from "../enum/enum";
import { isPrivileged } from "../middleware/role-middleware";
import { projectService } from "./projects-service";
import { updateService } from "./updates-service";


class TaskService {

    private readonly selectSql = `
        SELECT
            t.id_task AS idTask,
            t.id_project AS idProject,
            p.project_name AS projectName,
            c.client_name AS clientName,
            t.id_update AS idUpdate,
            t.task_text AS taskText,
            t.id_owner AS idOwner,
            o.first_name AS ownerName,
            t.id_with_user AS idWithUser,
            w.first_name AS withName,
            t.with_client AS withClient,
            t.priority,
            t.due_date AS dueDate,
            t.is_done AS isDone,
            t.done_at AS doneAt,
            t.id_created_by AS idCreatedBy,
            t.created_at AS createdAt
        FROM tasks t

        LEFT JOIN projects p
            ON p.id_project = t.id_project

        LEFT JOIN clients c
            ON c.id_client = p.id_client

        LEFT JOIN users o
            ON o.id_user = t.id_owner

        LEFT JOIN users w
            ON w.id_user = t.id_with_user
    `;


    //Tasks of one project
    public async getProjectTasks(idProject: number): Promise<TaskModel[]> {
        const sql = `${this.selectSql} WHERE t.id_project = ? ORDER BY t.is_done, t.created_at DESC`;
        return await dal.execute(sql, [idProject]) as TaskModel[];
    }


    //Open tasks + tasks closed in the last 14 days.
    //Employee: tasks of his projects, and general tasks that are his.
    public async getTasks(user: TokenUser): Promise<TaskModel[]> {
        let access = "1 = 1";
        const values: number[] = [];

        if (!isPrivileged(user.role)) {
            access = `(
                EXISTS (SELECT 1 FROM project_members m WHERE m.id_project = t.id_project AND m.id_user = ?)
                OR (t.id_project IS NULL AND ? IN (t.id_owner, t.id_with_user, t.id_created_by))
            )`;
            values.push(user.idUser, user.idUser);
        }

        const sql = `
            ${this.selectSql}
            WHERE ${access}
            AND (p.id_project IS NULL OR (p.status NOT IN ('completed', 'dropped')))
            AND (t.is_done = FALSE OR t.done_at >= NOW() - INTERVAL 14 DAY)
            ORDER BY t.is_done, FIELD(t.priority, 'urgent', 'high', 'normal', 'low'), t.due_date IS NULL, t.due_date, t.created_at DESC
        `;

        return await dal.execute(sql, values) as TaskModel[];
    }


    //Add Task (with or without project)
    public async addTask(task: TaskDto, user: TokenUser): Promise<TaskModel> {
        const clean = this.cleanTask(task);

        if (clean.idProject) {
            await projectService.assertAccess(user, clean.idProject);
        }

        const sql = `
            INSERT INTO tasks (id_project, task_text, id_owner, id_with_user, with_client, priority, due_date, id_created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const info = await dal.execute(sql, [
            clean.idProject, clean.taskText, clean.idOwner, clean.idWithUser, clean.withClient, clean.priority, clean.dueDate, user.idUser
        ]) as OkPacketParams;

        if (clean.idProject) await projectService.touch(clean.idProject);

        return await this.getOneTask(info.insertId!);
    }


    //Update Task (text, owner, priority, due date...)
    public async updateTask(id: number, task: Partial<TaskDto>, user: TokenUser): Promise<TaskModel> {
        const current = await this.getOneTask(id);
        await this.assertTaskAccess(current, user);

        const clean = this.cleanTask({ ...current, ...task });

        if (clean.idProject && clean.idProject !== current.idProject) {
            await projectService.assertAccess(user, clean.idProject);
        }

        const sql = `
            UPDATE tasks
            SET
                id_project = ?,
                task_text = ?,
                id_owner = ?,
                id_with_user = ?,
                with_client = ?,
                priority = ?,
                due_date = ?
            WHERE id_task = ?
        `;

        await dal.execute(sql, [
            clean.idProject, clean.taskText, clean.idOwner, clean.idWithUser, clean.withClient, clean.priority, clean.dueDate, id
        ]);

        return await this.getOneTask(id);
    }


    //Done / undo. Done task of a project is written to the project's log
    public async setDone(id: number, isDone: boolean, user: TokenUser): Promise<TaskModel> {
        const current = await this.getOneTask(id);
        await this.assertTaskAccess(current, user);

        const sql = `
            UPDATE tasks
            SET
                is_done = ?,
                done_at = IF(?, CURRENT_TIMESTAMP, NULL),
                id_done_by = IF(?, ?, NULL)
            WHERE id_task = ?
        `;

        await dal.execute(sql, [isDone, isDone, isDone, user.idUser, id]);

        if (current.idProject && isDone && !current.isDone) {
            await updateService.logUpdate(current.idProject, UpdateType.TaskCompleted, `הושלמה משימה: ${current.taskText}`, user.idUser);
        }

        return await this.getOneTask(id);
    }


    //Delete Task - creator, admin or manager
    public async deleteTask(id: number, user: TokenUser): Promise<void> {
        const current = await this.getOneTask(id);
        await this.assertTaskAccess(current, user);

        if (!isPrivileged(user.role) && current.idCreatedBy !== user.idUser) {
            throw new ForbiddenError("אפשר למחוק רק משימה שיצרת");
        }

        await dal.execute(`DELETE FROM tasks WHERE id_task = ?`, [id]);
    }


    private async assertTaskAccess(task: TaskModel, user: TokenUser): Promise<void> {
        if (task.idProject) {
            await projectService.assertAccess(user, task.idProject);
            return;
        }
        if (isPrivileged(user.role)) return;
        if (![task.idOwner, task.idWithUser, task.idCreatedBy].includes(user.idUser)) {
            throw new ForbiddenError();
        }
    }


    private async getOneTask(id: number): Promise<TaskModel> {
        const tasks = await dal.execute(`${this.selectSql} WHERE t.id_task = ?`, [id]) as TaskModel[];
        if (!tasks[0]) {
            throw new ResourceNotFoundError(id);
        }
        return tasks[0];
    }


    private cleanTask(task: TaskDto) {
        const taskText = sanitizeText(task.taskText);
        if (!taskText) throw new ValidationError("צריך לכתוב את המשימה");

        return {
            idProject: numberOrNull(task.idProject),
            taskText,
            idOwner: numberOrNull(task.idOwner),
            idWithUser: numberOrNull(task.idWithUser),
            withClient: Boolean(task.withClient),
            priority: enumOrDefault(task.priority, Object.values(Priority), Priority.Normal),
            dueDate: dateOrNull(task.dueDate)
        };
    }

}


export const taskService = new TaskService();
