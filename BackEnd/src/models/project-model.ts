import { InvoiceStatus, LoadLevel, MemberRole, ProjectKind, ProjectPhase, StageStatus, Urgency } from "../enum/enum";
import { TaskModel } from "./task-model";
import { UpdateModel } from "./update-model";

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

    //Calculated in the list query
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
    clientName?: string | null;          //New client is created when the name does not exist
    projectName?: string | null;
    status?: string | null;
    phase?: ProjectPhase | null;
    urgency?: Urgency;
    deadline?: string | null;
    endDate?: string | null;
    hoursBillable?: number | null;
    hoursAllocated?: number | null;
    hoursDone?: number | null;
    contactName?: string | null;
    quote?: string | null;
    invoiceStatus?: InvoiceStatus;
    invoiceWhat?: string | null;
    billingNotes?: string | null;
    notes?: string | null;
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
    loadLevel?: LoadLevel | null;
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
    sortOrder?: number | null;
}
