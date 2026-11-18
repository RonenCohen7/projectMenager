import type { InfoCategory } from "./enum";

export class InfoModel {
    idInfo!: number;
    title!: string;
    category!: InfoCategory;
    body!: string | null;
    isPinned!: boolean;
    idAuthor!: number | null;
    authorName!: string | null;
    createdAt!: string;
    updatedAt!: string;
}

export class InfoDto {
    title!: string;
    category!: InfoCategory;
    body?: string;
    isPinned?: boolean;
}
