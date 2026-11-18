import type { Priority, UpdateType } from "./enum";

export class UpdateModel {
    idUpdate!: number;
    idProject!: number;
    updateDate!: string;
    updateType!: UpdateType;
    participants!: string | null;
    summary!: string | null;
    tasksText!: string | null;
    statusAfter!: string | null;
    idAuthor!: number | null;
    authorName!: string | null;
    createdAt!: string;
    editedAt!: string | null;
}

export class UpdateDto {
    updateDate!: string;
    updateType!: UpdateType;
    participants?: string;
    summary?: string;
    tasksText?: string;
    statusAfter?: string;
    nextStep?: string;
    withWhom?: string;           //"client" | idUser | ""
    idWithUser?: number | null;
    withClient?: boolean;
    taskPriority?: Priority;
    taskDue?: string;
}
