import { OkPacketParams } from "mysql2";
import { ClientDto, ClientModel } from "../models/client-model";
import { dal } from "../utils/dal";
import { ResourceNotFoundError, ValidationError } from "../models/client-errors";
import { cleanOrNull, sanitizeText } from "../utils/sanitize";


class ClientService {

    private readonly selectSql = `
        SELECT
            c.id_client AS idClient,
            c.client_name AS clientName,
            c.contact_name AS contactName,
            c.contact_email AS contactEmail,
            c.contact_phone AS contactPhone,
            c.notes,
            c.created_at AS createdAt,
            c.updated_at AS updatedAt,
            (SELECT COUNT(*) FROM projects p WHERE p.id_client = c.id_client) AS projectsCount,
            (SELECT COUNT(*) FROM projects p
                WHERE p.id_client = c.id_client
                AND p.kind = 'project'
                AND p.status <> 'completed') AS activeProjectsCount
        FROM clients c
    `;


    //Get All Clients
    public async getAllClients(): Promise<ClientModel[]> {
        const sql = `${this.selectSql} ORDER BY c.client_name`;
        return await dal.execute(sql) as ClientModel[];
    }


    //Get One Client
    public async getOneClient(id: number): Promise<ClientModel> {
        const sql = `${this.selectSql} WHERE c.id_client = ?`;
        const clients = await dal.execute(sql, [id]) as ClientModel[];
        if (!clients[0]) {
            throw new ResourceNotFoundError(id);
        }
        return clients[0];
    }


    //Add Client
    public async addClient(client: ClientDto): Promise<ClientModel> {
        const clientName = sanitizeText(client.clientName);
        if (!clientName) throw new ValidationError("יש למלא שם לקוח");

        const sql = `
            INSERT INTO clients (client_name, contact_name, contact_email, contact_phone, notes)
            VALUES (?, ?, ?, ?, ?)
        `;

        const info = await dal.execute(sql, [
            clientName,
            cleanOrNull(client.contactName),
            cleanOrNull(client.contactEmail),
            cleanOrNull(client.contactPhone),
            cleanOrNull(client.notes)
        ]) as OkPacketParams;

        return await this.getOneClient(info.insertId!);
    }


    //Update Client
    public async updateClient(id: number, client: ClientDto): Promise<ClientModel> {
        const clientName = sanitizeText(client.clientName);
        if (!clientName) throw new ValidationError("יש למלא שם לקוח");

        const sql = `
            UPDATE clients
            SET
                client_name = ?,
                contact_name = ?,
                contact_email = ?,
                contact_phone = ?,
                notes = ?
            WHERE id_client = ?
        `;

        const info = await dal.execute(sql, [
            clientName,
            cleanOrNull(client.contactName),
            cleanOrNull(client.contactEmail),
            cleanOrNull(client.contactPhone),
            cleanOrNull(client.notes),
            id
        ]) as OkPacketParams;

        if (info.affectedRows === 0) {
            throw new ResourceNotFoundError(id);
        }

        return await this.getOneClient(id);
    }


    //Delete Client (projects stay, without client)
    public async deleteClient(id: number): Promise<void> {
        const info = await dal.execute(`DELETE FROM clients WHERE id_client = ?`, [id]) as OkPacketParams;
        if (info.affectedRows === 0) {
            throw new ResourceNotFoundError(id);
        }
    }


    //Same client typed with different spelling (spaces, quotes, י/ו) -> existing client. Otherwise create.
    public async findOrCreate(name: string): Promise<number | null> {
        const clientName = sanitizeText(name);
        if (!clientName) return null;

        const canon = (text: string) => text.replace(/[\s"'״׳\-–.]/g, "").replace(/[יו]/g, "").toLowerCase();

        const clients = await dal.execute(`SELECT id_client AS idClient, client_name AS clientName FROM clients`) as ClientModel[];

        const match = clients.find(client => canon(client.clientName) === canon(clientName));
        if (match) return match.idClient;

        const info = await dal.execute(`INSERT INTO clients (client_name) VALUES (?)`, [clientName]) as OkPacketParams;
        return info.insertId!;
    }

}


export const clientService = new ClientService();
