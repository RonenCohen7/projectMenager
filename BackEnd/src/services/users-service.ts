import { OkPacketParams } from "mysql2";
import { UserDto, UserModel, UserProjectDto } from "../models/user-model";
import { dal } from "../utils/dal";
import { ConflictError, ResourceNotFoundError, ValidationError } from "../models/client-errors";
import { enumOrDefault, numberOrNull, sanitizeText } from "../utils/sanitize";
import { MemberRole, UserRole } from "../enum/enum";
import { appConfig } from "../utils/app-config";


class UserService {

    private readonly selectSql = `
        SELECT
            id_user AS idUser,
            first_name AS firstName,
            last_name AS lastName,
            email,
            role,
            job_percent AS jobPercent,
            is_active AS isActive,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM users
    `;


    //Create first admin from .env if missing
    public async ensureAdmin(): Promise<void> {
        if (!appConfig.adminEmail) return;

        const users = await dal.execute(`SELECT id_user FROM users WHERE email = ?`, [appConfig.adminEmail]) as any[];
        if (users[0]) return;

        await dal.execute(
            `INSERT INTO users (first_name, email, role) VALUES (?, ?, ?)`,
            [appConfig.adminFirstName, appConfig.adminEmail, UserRole.Admin]
        );
        console.log(`Admin user created: ${appConfig.adminEmail}`);
    }


    //Get All Users
    public async getAllUsers(): Promise<UserModel[]> {
        const sql = `${this.selectSql} ORDER BY is_active DESC, first_name`;
        return await dal.execute(sql) as UserModel[];
    }


    //Get One User
    public async getOneUser(id: number): Promise<UserModel> {
        const sql = `${this.selectSql} WHERE id_user = ?`;
        const users = await dal.execute(sql, [id]) as UserModel[];
        const user = users[0];
        if (!user) {
            throw new ResourceNotFoundError(id);
        }
        return user;
    }


    //Add User (admin) - default role employee
    public async addUser(user: UserDto): Promise<UserModel> {
        const clean = this.cleanUser(user);

        if (!clean.firstName) throw new ValidationError("יש למלא שם פרטי");
        if (!clean.email.includes("@")) throw new ValidationError("יש להזין כתובת מייל תקינה");

        const existing = await dal.execute(`SELECT id_user FROM users WHERE email = ?`, [clean.email]) as any[];
        if (existing[0]) {
            throw new ConflictError("המייל כבר קיים במערכת");
        }

        const sql = `
            INSERT INTO users (first_name, last_name, email, role, job_percent, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const info = await dal.execute(sql, [
            clean.firstName,
            clean.lastName,
            clean.email,
            clean.role,
            clean.jobPercent,
            user.isActive ?? true
        ]) as OkPacketParams;

        return await this.getOneUser(info.insertId!);
    }


    //Update User (admin)
    public async updateUser(id: number, user: UserDto, idCurrentUser: number): Promise<UserModel> {
        const current = await this.getOneUser(id);
        const clean = this.cleanUser({ ...current, ...user });

        if (!clean.firstName) throw new ValidationError("יש למלא שם פרטי");
        if (!clean.email.includes("@")) throw new ValidationError("יש להזין כתובת מייל תקינה");

        const isActive = user.isActive ?? current.isActive;

        if (id === idCurrentUser && (clean.role !== UserRole.Admin || !isActive)) {
            throw new ValidationError("אי אפשר להוריד לעצמך הרשאת אדמין או לבטל את המשתמש שלך");
        }

        const sql = `
            UPDATE users
            SET
                first_name = ?,
                last_name = ?,
                email = ?,
                role = ?,
                job_percent = ?,
                is_active = ?
            WHERE id_user = ?
        `;

        await dal.execute(sql, [clean.firstName, clean.lastName, clean.email, clean.role, clean.jobPercent, isActive, id]);

        return await this.getOneUser(id);
    }


    //Delete User (admin)
    public async deleteUser(id: number, idCurrentUser: number): Promise<void> {
        if (id === idCurrentUser) {
            throw new ValidationError("אי אפשר למחוק את המשתמש שלך");
        }

        const info = await dal.execute(`DELETE FROM users WHERE id_user = ?`, [id]) as OkPacketParams;
        if (info.affectedRows === 0) {
            throw new ResourceNotFoundError(id);
        }
    }


    //Projects the user is allowed to work in (replaces the list, keeps load levels)
    public async updateUserProjects(id: number, projects: UserProjectDto[]): Promise<void> {
        await this.getOneUser(id);

        const unique = new Map<number, MemberRole>();
        for (const project of Array.isArray(projects) ? projects : []) {
            const idProject = Number(project.idProject);
            if (Number.isInteger(idProject) && idProject > 0) {
                unique.set(idProject, enumOrDefault(project.memberRole, Object.values(MemberRole), MemberRole.Team));
            }
        }

        await dal.transaction(async connection => {

            const ids = [...unique.keys()];

            if (ids.length) {
                await connection.query(
                    `DELETE FROM project_members WHERE id_user = ? AND id_project NOT IN (${ids.map(() => "?").join(",")})`,
                    [id, ...ids]
                );
            } else {
                await connection.query(`DELETE FROM project_members WHERE id_user = ?`, [id]);
            }

            for (const [idProject, memberRole] of unique) {
                await connection.query(
                    `INSERT INTO project_members (id_project, id_user, member_role)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE member_role = VALUES(member_role)`,
                    [idProject, id, memberRole]
                );
            }
        });
    }


    private cleanUser(user: UserDto) {
        const jobPercent = numberOrNull(user.jobPercent) ?? 100;
        return {
            firstName: sanitizeText(user.firstName),
            lastName: sanitizeText(user.lastName),
            email: sanitizeText(user.email).toLowerCase(),
            role: enumOrDefault(user.role, Object.values(UserRole), UserRole.Employee),
            jobPercent: Math.min(100, Math.max(0, Math.round(jobPercent)))
        };
    }

}


export const userService = new UserService();
