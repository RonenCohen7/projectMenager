import type { InvoiceStatus, LoadLevel, MemberRole, ProjectKind, ProjectPhase, StageStatus, Urgency } from "./enum";
import type { TaskModel } from "./task-model";
import type { UpdateModel } from "./update-model";

export class ProjectModel {
    idProject!: number;
    kind!: ProjectKind;
    idClient!: number | null;
    clientName!: string | null;
    projectName!: string | null;
    status!: string;
    phase!: ProjectPhase | null;
    urgency!: Urgency;
    deadline!: string | null;
    endDate!: string | null;
    hoursBillable!: number | null;
    hoursAllocated!: number | null;
    hoursDone!: number | null;
    contactName!: string | null;
    quote!: string | null;
    invoiceStatus!: InvoiceStatus;
    invoiceWhat!: string | null;
    billingNotes!: string | null;
    invoiceSentDate!: string | null;
    paidDate!: string | null;
    notes!: string | null;
    createdAt!: string;
    updatedAt!: string;

    lastUpdateDate!: string | null;
    lastSummary!: string | null;
    stagesTotal!: number;
    stagesDone!: number;
    currentStage!: string | null;

    members!: ProjectMemberModel[];
}

export class ProjectDetailsModel extends ProjectModel {
    stages!: StageModel[];
    updates!: UpdateModel[];
    tasks!: TaskModel[];
}

export class ProjectDto {
    kind?: ProjectKind;
    idClient?: number | null;
    clientName?: string;
    projectName?: string;
    status?: string;
    phase?: ProjectPhase | "" | null;
    urgency?: Urgency;
    deadline?: string;
    endDate?: string;
    hoursBillable?: number | string | null;
    hoursAllocated?: number | string | null;
    hoursDone?: number | string | null;
    contactName?: string;
    quote?: string;
    invoiceStatus?: InvoiceStatus;
    invoiceWhat?: string;
    billingNotes?: string;
    notes?: string;
    members?: ProjectMemberDto[];
}

export class ProjectMemberModel {
    idProject!: number;
    idUser!: number;
    firstName!: string;
    lastName!: string;
    memberRole!: MemberRole;
    loadLevel!: LoadLevel | null;
}

export class ProjectMemberDto {
    idUser!: number;
    memberRole!: MemberRole;
}

export class StageModel {
    idStage!: number;
    idProject!: number;
    sortOrder!: number;
    stageGroup!: string | null;
    stageName!: string;
    idOwner!: number | null;
    ownerName!: string | null;
    status!: StageStatus;
    hours!: number | null;
    dueDate!: string | null;
}

export class StageDto {
    stageGroup?: string | null;
    stageName!: string;
    idOwner?: number | null;
    status?: StageStatus;
    hours?: number | null;
    dueDate?: string | null;
    sortOrder?: number;
}
