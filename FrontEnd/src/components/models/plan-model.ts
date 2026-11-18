import type { PlanStatus } from "./enum";

export class PlanModel {
    idPlan!: number;
    title!: string;
    area!: string | null;
    quarter!: string | null;
    idOwner!: number | null;
    ownerName!: string | null;
    status!: PlanStatus;
    dueDate!: string | null;
    kpi!: string | null;
    notes!: string | null;
    createdAt!: string;
    updatedAt!: string;
}

export class PlanDto {
    title!: string;
    area?: string;
    quarter?: string;
    idOwner?: number | null;
    status?: PlanStatus;
    dueDate?: string | null;
    kpi?: string;
    notes?: string;
}
