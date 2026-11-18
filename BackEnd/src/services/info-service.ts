import { OkPacketParams } from "mysql2";
import { dal } from "../utils/dal";
import { InfoDto, InfoModel } from "../models/info-model";
import { TokenUser } from "../models/user-model";
import { ResourceNotFoundError, ValidationError } from "../models/client-errors";
import { enumOrDefault, sanitizeText } from "../utils/sanitize";
import { InfoCategory } from "../enum/enum";


class InfoService {

    private readonly selectSql = `
        SELECT
            i.id_info AS idInfo,
            i.title,
            i.category,
            i.body,
            i.is_pinned AS isPinned,
            i.id_author AS idAuthor,
            TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS authorName,
            i.created_at AS createdAt,
            i.updated_at AS updatedAt
        FROM info_items i

        LEFT JOIN users u
            ON u.id_user = i.id_author
    `;


    //Get All Info Cards - pinned first
    public async getAllInfo(): Promise<InfoModel[]> {
        return await dal.execute(`${this.selectSql} ORDER BY i.is_pinned DESC, i.updated_at DESC`) as InfoModel[];
    }


    //Add Info Card
    public async addInfo(info: InfoDto, user: TokenUser): Promise<InfoModel> {
        const clean = this.cleanInfo(info);

        const sql = `
            INSERT INTO info_items (title, category, body, is_pinned, id_author)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await dal.execute(sql, [clean.title, clean.category, clean.body, clean.isPinned, user.idUser]) as OkPacketParams;
        return await this.getOneInfo(result.insertId!);
    }


    //Update Info Card
    public async updateInfo(id: number, info: InfoDto, user: TokenUser): Promise<InfoModel> {
        const current = await this.getOneInfo(id);
        const clean = this.cleanInfo({ ...current, ...info });

        const sql = `
            UPDATE info_items
            SET title = ?, category = ?, body = ?, is_pinned = ?, id_author = ?
            WHERE id_info = ?
        `;

        await dal.execute(sql, [clean.title, clean.category, clean.body, clean.isPinned, user.idUser, id]);
        return await this.getOneInfo(id);
    }


    //Delete Info Card
    public async deleteInfo(id: number): Promise<void> {
        const info = await dal.execute(`DELETE FROM info_items WHERE id_info = ?`, [id]) as OkPacketParams;
        if (info.affectedRows === 0) {
            throw new ResourceNotFoundError(id);
        }
    }


    private async getOneInfo(id: number): Promise<InfoModel> {
        const items = await dal.execute(`${this.selectSql} WHERE i.id_info = ?`, [id]) as InfoModel[];
        if (!items[0]) {
            throw new ResourceNotFoundError(id);
        }
        return items[0];
    }


    //Body is free text (line breaks kept) - shown as text in the UI, never as HTML
    private cleanInfo(info: InfoDto) {
        const title = sanitizeText(info.title);
        if (!title) throw new ValidationError("צריך כותרת");

        return {
            title,
            category: enumOrDefault(info.category, Object.values(InfoCategory), InfoCategory.General),
            body: typeof info.body === "string" ? info.body.slice(0, 20000) : null,
            isPinned: Boolean(info.isPinned)
        };
    }

}


export const infoService = new InfoService();
