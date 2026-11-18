import { Priority } from "../enum/enum";

export class TaskModel {
    idTask!: number;
    idProject!: number | null;
    projectName!: string | null;
    clientName!: string | null;
    idUpdate!: number | null;
    taskText!: string;
    idOwner!: number | null;
    ownerName!: string | null;
    idWithUser!: number | null;
    withName!: string | null;
    withClient!: boolean;
    priority!: Priority;
    dueDate!: string | null;
    isDone!: boolean;
    doneAt!: string | null;
    idCreatedBy!: number | null;
    createdAt!: string;
}

export class TaskDto {
    idProject?: number | null;
    taskText!: string;
    idOwner?: number | null;
    idWithUser?: number | null;
    withClient?: boolean;
    priority?: Priority;
    dueDate?: string | null;
}
