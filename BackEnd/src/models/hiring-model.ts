import { HiringStatus } from "../enum/enum";

export class HiringModel {
    idHiring!: number;
    roleTitle!: string;
    status!: HiringStatus;
    candidateName!: string | null;
    scopePercent!: number | null;
    startDate!: string | null;
    source!: string | null;
    notes!: string | null;
    createdAt!: string;
    updatedAt!: string;
}

export class HiringDto {
    roleTitle!: string;
    status?: HiringStatus;
    candidateName?: string | null;
    scopePercent?: number | null;
    startDate?: string | null;
    source?: string | null;
    notes?: string | null;
}
