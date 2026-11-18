export class ClientModel {
    idClient!: number;
    clientName!: string;
    contactName!: string | null;
    contactEmail!: string | null;
    contactPhone!: string | null;
    notes!: string | null;
    projectsCount!: number;
    activeProjectsCount!: number;
    createdAt!: string;
    updatedAt!: string;
}

export class ClientDto {
    clientName!: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
}
