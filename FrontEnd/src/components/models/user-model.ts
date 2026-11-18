import { UserRole } from "./enum";

export class UserModel {
    idUser!: number;
    firstName!: string;
    lastName!: string;
    email!: string;
    role!: UserRole;
    jobPercent!: number;
    isActive!: boolean;
    createdAt!: string;
    updatedAt!: string;
}

export class UserDto {
    firstName!: string;
    lastName?: string;
    email!: string;
    role!: UserRole;
    jobPercent!: number;
    isActive!: boolean;
}

export class AuthResponseModel {
    token!: string;
    user!: UserModel;
}
