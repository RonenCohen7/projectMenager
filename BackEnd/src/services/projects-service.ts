import { OkPacketParams } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { dal } from "../utils/dal";
import { ForbiddenError, ResourceNotFoundError, ValidationError } from "../models/client-errors";
import { cleanOrNull, dateOrNull, enumOrDefault, numberOrNull } from "../utils/sanitize";
import { ProjectDetailsModel, ProjectDto, ProjectMemberDto, ProjectMemberModel, ProjectModel } from "../models/project-model";
import { TokenUser } from "../models/user-model";
import { InvoiceStatus, LeadStatus, LoadLevel, MemberRole, ProjectKind, ProjectPhase, ProjectStatus, UpdateType, Urgency } from "../enum/enum";
import { isPrivileged } from "../middleware/role-middleware";
import { clientService } from "./clients-service";
import { stageService } from "./stages-service";
import { updateService } from "./updates-service";
import { taskService } from "./tasks-service";


class ProjectService {

    private readonly selectSql = `
        SELECT
            p.id_project AS idProject,
            p.kind,
            p.id_client AS idClient,
            c.client_name AS clientName,
            p.project_name AS projectName,
            p.status,
            p.phase,
            p.urgency,
            p.deadline,
            p.end_date AS endDate,
            p.hours_billable AS hoursBillable,
            p.hours_allocated AS hoursAllocated,
            p.hours_done AS hoursDone,
            p.contact_name AS contactName,
            p.quote,
            p.invoice_status AS invoiceStatus,
            p.invoice_what AS invoiceWhat,
            p.billing_notes AS billingNotes,
            p.invoice_sent_date AS invoiceSentDate,
            p.paid_date AS paidDate,
            p.notes,
            p.created_at AS createdAt,
            p.updated_at AS updatedAt,

            (SELECT MAX(u.update_date) FROM project_updates u WHERE u.id_project = p.id_project) AS lastUpdateDate,
            (SELECT u.summary FROM project_updates u
                WHERE u.id_project = p.id_project
                ORDER BY u.update_date DESC, u.created_at DESC LIMIT 1) AS lastSummary,
            (SELECT COUNT(*) FROM project_stages s WHERE s.id_project = p.id_project) AS stagesTotal,
            (SELECT COUNT(*) FROM project_stages s WHERE s.id_project = p.id_project AND s.status = 'done') AS stagesDone,
            (SELECT s.stage_name FROM project_stages s
                WHERE s.id_project = p.id_project AND s.status <> 'done'
                ORDER BY s.sort_order LIMIT 1) AS currentStage

        FROM projects p

        LEFT JOIN clients c
            ON c.id_client = p.id_client
    `;


    //Employee sees only projects he is a member of
    private accessCondition(user: TokenUser): { sql: string, values: number[] } {
        if (isPrivileged(user.role)) {
            return { sql: "1 = 1", values: [] };
        }
        return {
            sql: "EXISTS (SELECT 1 FROM project_members m WHERE m.id_project = p.id_project AND m.id_user = ?)",
            values: [user.idUser]
        };
    }


    //Throws when the user may not see the project
    public async assertAccess(user: TokenUser, idProject: number): Promise<void> {
        const projects = await dal.execute(`SELECT id_project FROM projects WHERE id_project = ?`, [idProject]) as any[];
        if (!projects[0]) {
            throw new ResourceNotFoundError(idProject);
        }

        if (isPrivileged(user.role)) return;

        const sql = `SELECT 1 FROM project_members WHERE id_project = ? AND id_user = ?`;
        const members = await dal.execute(sql, [idProject, user.idUser]) as any[];

        if (!members[0]) {
            throw new ForbiddenError("אינך משויך/ת לפרויקט הזה");
        }
    }


    //Get All Projects (and leads) the user can see
    public async getAllProjects(user: TokenUser): Promise<ProjectModel[]> {
        const access = this.accessCondition(user);

        const sql = `${this.selectSql} WHERE ${access.sql} ORDER BY p.updated_at DESC`;

        const projects = await dal.execute(sql, access.values) as ProjectModel[];

        const members = await this.getMembers(projects.map(project => project.idProject));

        for (const project of projects) {
            project.members = members.filter(member => member.idProject === project.idProject);
        }

        return projects;
    }


    //Get One Project with stages, meeting log and tasks
    public async getOneProject(user: TokenUser, id: number): Promise<ProjectDetailsModel> {
        await this.assertAccess(user, id);

        const projects = await dal.execute(`${this.selectSql} WHERE p.id_project = ?`, [id]) as ProjectDetailsModel[];
        const project = projects[0];

        project.members = await this.getMembers([id]);
        project.stages = await stageService.getProjectStages(id);
        project.updates = await updateService.getProjectUpdates(id);
        project.tasks = await taskService.getProjectTasks(id);

        return project;
    }


    //Members of projects
    private async getMembers(ids: number[]): Promise<ProjectMemberModel[]> {
        if (!ids.length) return [];

        const sql = `
            SELECT
                m.id_project AS idProject,
                m.id_user AS idUser,
                u.first_name AS firstName,
                u.last_name AS lastName,
                m.member_role AS memberRole,
                m.load_level AS loadLevel
            FROM project_members m

            INNER JOIN users u
                ON u.id_user = m.id_user

            WHERE m.id_project IN (${ids.map(() => "?").join(",")})

            ORDER BY FIELD(m.member_role, 'manager', 'executor', 'team'), u.first_name
        `;

        return await dal.execute(sql, ids) as ProjectMemberModel[];
    }


    //Add Project / Lead (admin + manager)
    public async addProject(project: ProjectDto, user: TokenUser): Promise<ProjectDetailsModel> {
        const kind = enumOrDefault(project.kind, Object.values(ProjectKind), ProjectKind.Project);
        const values = await this.cleanProject({ ...project, kind });

        const id = await dal.transaction(async connection => {

            const sql = `
                INSERT INTO projects (
                    kind, id_client, project_name, status, phase, urgency, deadline, end_date,
                    hours_billable, hours_allocated, hours_done, contact_name, quote,
                    invoice_status, invoice_what, billing_notes, notes, id_created_by
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [info] = await connection.query(sql, [kind, ...values, user.idUser]) as [OkPacketParams, any];

            const idProject = info.insertId!;

            await this.saveMembers(connection, idProject, project.members ?? []);

            return idProject;
        });

        return await this.getOneProject(user, id);
    }


    //Update Project (admin + manager)
    public async updateProject(id: number, project: ProjectDto, user: TokenUser): Promise<ProjectDetailsModel> {
        const current = await this.getOneProject(user, id);

        const values = await this.cleanProject({ ...current, clientName: undefined, ...project, kind: current.kind });

        await dal.transaction(async connection => {

            const sql = `
                UPDATE projects
                SET
                    id_client = ?,
                    project_name = ?,
                    status = ?,
                    phase = ?,
                    urgency = ?,
                    deadline = ?,
                    end_date = ?,
                    hours_billable = ?,
                    hours_allocated = ?,
                    hours_done = ?,
                    contact_name = ?,
                    quote = ?,
                    invoice_status = ?,
                    invoice_what = ?,
                    billing_notes = ?,
                    notes = ?
                WHERE id_project = ?
            `;

            await connection.query(sql, [...values, id]);

            if (project.members) {
                await this.saveMembers(connection, id, project.members);
            }
        });

        return await this.getOneProject(user, id);
    }


    //Status / phase (kanban) - admin, manager or a project member
    public async updateStatus(id: number, status: string | undefined, phase: string | null | undefined, user: TokenUser): Promise<void> {
        await this.assertAccess(user, id);

        const kind = await this.getKind(id);

        if (status !== undefined) {
            await dal.execute(`UPDATE projects SET status = ? WHERE id_project = ?`, [this.cleanStatus(kind, status), id]);
        }

        if (phase !== undefined) {
            await dal.execute(
                `UPDATE projects SET phase = ? WHERE id_project = ?`,
                [phase ? enumOrDefault(phase, Object.values(ProjectPhase), ProjectPhase.Development) : null, id]
            );
        }
    }


    //Lead -> active project
    public async convertLead(id: number, user: TokenUser): Promise<void> {
        await this.assertAccess(user, id);

        await dal.execute(
            `UPDATE projects SET kind = ?, status = ? WHERE id_project = ? AND kind = ?`,
            [ProjectKind.Project, ProjectStatus.NotStarted, id, ProjectKind.Lead]
        );
    }


    //Invoice status (admin + manager) - logs the change to the project's log
    public async updateInvoice(id: number, invoiceStatus: InvoiceStatus, user: TokenUser): Promise<void> {
        const project = await this.getOneProject(user, id);

        const status = enumOrDefault(invoiceStatus, Object.values(InvoiceStatus), InvoiceStatus.None);

        const sql = `
            UPDATE projects
            SET
                invoice_status = ?,
                invoice_sent_date = IF(? = 'sent', CURDATE(), invoice_sent_date),
                paid_date = IF(? = 'paid', CURDATE(), paid_date)
            WHERE id_project = ?
        `;

        await dal.execute(sql, [status, status, status, id]);

        const labels: Record<InvoiceStatus, string> = {
            [InvoiceStatus.Ready]: "מוכן להוצאת חשבונית",
            [InvoiceStatus.Sent]: "נשלחה חשבונית",
            [InvoiceStatus.Paid]: "התקבל תשלום",
            [InvoiceStatus.NotBillable]: "סומן כלא רלוונטי לחיוב",
            [InvoiceStatus.None]: "סטטוס החשבונית אופס"
        };

        if (status !== InvoiceStatus.NotBillable) {
            await updateService.logUpdate(id, UpdateType.Invoice,
                `חשבונית: ${labels[status]}${project.invoiceWhat ? ` (${project.invoiceWhat})` : ""}`, user.idUser);
        }
    }


    //Load level of one member (heat map)
    public async updateMemberLoad(id: number, idUser: number, loadLevel: LoadLevel | null): Promise<void> {
        const level = loadLevel ? enumOrDefault(loadLevel, Object.values(LoadLevel), LoadLevel.Medium) : null;

        const info = await dal.execute(
            `UPDATE project_members SET load_level = ? WHERE id_project = ? AND id_user = ?`,
            [level, id, idUser]
        ) as OkPacketParams;

        if (info.affectedRows === 0) {
            throw new ResourceNotFoundError(idUser);
        }
    }


    //Delete Project (admin)
    public async deleteProject(id: number): Promise<void> {
        const info = await dal.execute(`DELETE FROM projects WHERE id_project = ?`, [id]) as OkPacketParams;
        if (info.affectedRows === 0) {
            throw new ResourceNotFoundError(id);
        }
    }


    //Touch updated_at (after a meeting log / task / stage change)
    public async touch(id: number): Promise<void> {
        await dal.execute(`UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id_project = ?`, [id]);
    }


    public async getKind(id: number): Promise<ProjectKind> {
        const projects = await dal.execute(`SELECT kind FROM projects WHERE id_project = ?`, [id]) as { kind: ProjectKind }[];
        if (!projects[0]) {
            throw new ResourceNotFoundError(id);
        }
        return projects[0].kind;
    }


    //Status must match the kind (project / lead)
    public cleanStatus(kind: ProjectKind, status: unknown): string {
        return kind === ProjectKind.Lead
            ? enumOrDefault(status, Object.values(LeadStatus), LeadStatus.New)
            : enumOrDefault(status, Object.values(ProjectStatus), ProjectStatus.NotStarted);
    }


    //Replace the members list
    private async saveMembers(connection: PoolConnection, idProject: number, members: ProjectMemberDto[]): Promise<void> {

        const unique = new Map<number, ProjectMemberDto>();
        for (const member of members) {
            const idUser = Number(member.idUser);
            if (Number.isInteger(idUser) && idUser > 0 && !unique.has(idUser)) {
                unique.set(idUser, member);
            }
        }

        //Keep load levels that were set before
        const [currentRows] = await connection.query(
            `SELECT id_user AS idUser, load_level AS loadLevel FROM project_members WHERE id_project = ?`, [idProject]
        ) as [{ idUser: number, loadLevel: LoadLevel | null }[], any];

        await connection.query(`DELETE FROM project_members WHERE id_project = ?`, [idProject]);

        for (const [idUser, member] of unique) {
            const before = currentRows.find(row => row.idUser === idUser);
            const loadLevel = member.loadLevel !== undefined ? member.loadLevel : before?.loadLevel ?? null;

            await connection.query(
                `INSERT INTO project_members (id_project, id_user, member_role, load_level) VALUES (?, ?, ?, ?)`,
                [
                    idProject,
                    idUser,
                    enumOrDefault(member.memberRole, Object.values(MemberRole), MemberRole.Team),
                    loadLevel ? enumOrDefault(loadLevel, Object.values(LoadLevel), LoadLevel.Medium) : null
                ]
            );
        }
    }


    //Values in the order of the INSERT / UPDATE columns (without kind)
    private async cleanProject(project: ProjectDto) {
        const kind = project.kind as ProjectKind;

        let idClient = numberOrNull(project.idClient);
        if (project.clientName !== undefined && project.clientName !== null && project.clientName !== "") {
            idClient = await clientService.findOrCreate(project.clientName);
        }

        if (!idClient) {
            throw new ValidationError("צריך לבחור או למלא שם לקוח");
        }

        const hours = (value: unknown) => {
            const num = numberOrNull(value);
            if (num !== null && num < 0) throw new ValidationError("מספר שעות לא יכול להיות שלילי");
            return num;
        };

        return [
            idClient,
            cleanOrNull(project.projectName),
            this.cleanStatus(kind, project.status),
            project.phase ? enumOrDefault(project.phase, Object.values(ProjectPhase), ProjectPhase.Development) : null,
            enumOrDefault(project.urgency, Object.values(Urgency), Urgency.Normal),
            cleanOrNull(project.deadline),
            dateOrNull(project.endDate),
            hours(project.hoursBillable),
            hours(project.hoursAllocated),
            hours(project.hoursDone),
            cleanOrNull(project.contactName),
            cleanOrNull(project.quote),
            enumOrDefault(project.invoiceStatus, Object.values(InvoiceStatus), InvoiceStatus.None),
            cleanOrNull(project.invoiceWhat),
            cleanOrNull(project.billingNotes),
            cleanOrNull(project.notes)
        ];
    }

}


export const projectService = new ProjectService();
