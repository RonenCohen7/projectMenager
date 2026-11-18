import { OkPacketParams } from "mysql2";
import { dal } from "../utils/dal";
import { HiringDto, HiringModel } from "../models/hiring-model";
import { TokenUser } from "../models/user-model";
import { ResourceNotFoundError, ValidationError } from "../models/client-errors";
import { cleanOrNull, dateOrNull, enumOrDefault, numberOrNull, sanitizeText } from "../utils/sanitize";
import { HiringStatus } from "../enum/enum";


class HiringService {

    private readonly selectSql = `
        SELECT
            id_hiring AS idHiring,
            role_title AS roleTitle,
            status,
            candidate_name AS candidateName,
            scope_percent AS scopePercent,
            start_date AS startDate,
            source,
            notes,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM hiring
    `;


    //Get All Hiring
    public async getAllHiring(): Promise<HiringModel[]> {
        const sql = `${this.selectSql} ORDER BY FIELD(status, 'not_started', 'searching', 'interviewing', 'offer_sent', 'hired', 'closed'), created_at DESC`;
        return await dal.execute(sql) as HiringModel[];
    }


    //Add Hiring
    public async addHiring(hiring: HiringDto, user: TokenUser): Promise<HiringModel> {
        const values = this.cleanHiring(hiring);

        const sql = `
            INSERT INTO hiring (role_title, status, candidate_name, scope_percent, start_date, source, notes, id_author)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const info = await dal.execute(sql, [...values, user.idUser]) as OkPacketParams;
        return await this.getOneHiring(info.insertId!);
    }


    //Update Hiring
    public async updateHiring(id: number, hiring: HiringDto): Promise<HiringModel> {
        const current = await this.getOneHiring(id);
        const values = this.cleanHiring({ ...current, ...hiring });

        const sql = `
            UPDATE hiring
            SET role_title = ?, status = ?, candidate_name = ?, scope_percent = ?, start_date = ?, source = ?, notes = ?
            WHERE id_hiring = ?
        `;

        await dal.execute(sql, [...values, id]);
        return await this.getOneHiring(id);
    }


    //Delete Hiring
    public async deleteHiring(id: number): Promise<void> {
        const info = await dal.execute(`DELETE FROM hiring WHERE id_hiring = ?`, [id]) as OkPacketParams;
        if (info.affectedRows === 0) {
            throw new ResourceNotFoundError(id);
        }
    }


    private async getOneHiring(id: number): Promise<HiringModel> {
        const items = await dal.execute(`${this.selectSql} WHERE id_hiring = ?`, [id]) as HiringModel[];
        if (!items[0]) {
            throw new ResourceNotFoundError(id);
        }
        return items[0];
    }


    private cleanHiring(hiring: HiringDto) {
        const roleTitle = sanitizeText(hiring.roleTitle);
        if (!roleTitle) throw new ValidationError("יש למלא תפקיד");

        const scope = numberOrNull(hiring.scopePercent);

        return [
            roleTitle,
            enumOrDefault(hiring.status, Object.values(HiringStatus), HiringStatus.NotStarted),
            cleanOrNull(hiring.candidateName),
            scope === null ? null : Math.min(100, Math.max(0, Math.round(scope))),
            dateOrNull(hiring.startDate),
            cleanOrNull(hiring.source),
            cleanOrNull(hiring.notes)
        ];
    }

}


export const hiringService = new HiringService();
